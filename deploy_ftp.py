"""FTP auto-deploy — upload (and watch) project files to Hostinger FTP.

Usage:
    python deploy_ftp.py              # full upload once
    python deploy_ftp.py --watch      # upload now, then auto-upload on change
    python deploy_ftp.py --dry-run
    python deploy_ftp.py --remote-subdir apps/shiv

Credentials from ftp.env only (never hardcode secrets).
NOTE: This host is FTP-only (no SSH). Python services cannot be started here;
a small alive.php is published so the deploy is live/visible on the web.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from ftplib import FTP, error_perm
from pathlib import Path
from typing import Iterable

EXCLUDE_DIRS = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".cursor",
    "node_modules",
    "dist",
    "dist_package",
    "build",
    "ocr_store",
    "lan_jobs",
    "output",
    "screenshots",
    "logs",
    "reports",
    "web-data",
    "alm-output",
    "generated",
    "_dev_pkg_build",
    "data",
    ".chroma",
    "test_expected_fix",
    "input",
    "instance",
    "samples",
    "manual-tests",
}

EXCLUDE_FILES = {
    ".env",
    ".env.local",
    "ftp.env",
    "worker.env",
    "deploy_server_ssh.py",
    "mail-config.php",
    ".ftp_deploy_state.json",
}

EXCLUDE_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".log",
    ".7z",
    ".zip",
    ".db",
    ".sqlite",
    ".sqlite3",
}

EXCLUDE_NAME_PREFIXES = (
    "_test_",
    "_inspect_",
    "_deploy_",
    "_check_",
    "_conv_",
    "_bind_",
    "_fix_",
    "_start",
    "_go_",
    "_iis_",
    "_port",
    "_restore_",
    "_recheck_",
    "_expose_",
    "_use_",
    "_pick_",
    "_fw_",
    "_remote_",
)

DEFAULT_SHARED_ENV = Path(r"D:\C\Converter Dynamic 7\ftp.env")
STATE_NAME = ".ftp_deploy_state.json"


def load_env(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        data[key.strip()] = val.strip().strip('"').strip("'")
    return data


def find_ftp_env(project_root: Path) -> Path:
    candidates = [
        project_root / "ftp.env",
        project_root.parent / "ftp.env",
        DEFAULT_SHARED_ENV,
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(
        "ftp.env not found. Copy ftp.env.example to ftp.env and set FTP_PASS."
    )


def should_upload(rel: Path) -> bool:
    if any(part in EXCLUDE_DIRS for part in rel.parts):
        return False
    if any(part.startswith(EXCLUDE_NAME_PREFIXES) for part in rel.parts):
        return False
    if rel.name in EXCLUDE_FILES or rel.name.startswith(".env"):
        return False
    if rel.name.startswith(EXCLUDE_NAME_PREFIXES):
        return False
    if rel.suffix.lower() in EXCLUDE_SUFFIXES:
        return False
    if rel.name.endswith("_out.txt") or rel.name.endswith("_log.txt"):
        return False
    return True


def iter_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if should_upload(rel):
            yield rel


def file_fingerprint(path: Path) -> str:
    st = path.stat()
    return f"{st.st_mtime_ns}:{st.st_size}"


def load_state(root: Path) -> dict:
    path = root / STATE_NAME
    if not path.is_file():
        return {"files": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"files": {}}


def save_state(root: Path, state: dict) -> None:
    (root / STATE_NAME).write_text(json.dumps(state, indent=2), encoding="utf-8")


def ensure_remote_dir(ftp: FTP, remote_dir: str) -> None:
    parts = [p for p in remote_dir.replace("\\", "/").split("/") if p]
    cur = ""
    for part in parts:
        cur = f"{cur}/{part}"
        try:
            ftp.cwd(cur)
        except error_perm:
            try:
                ftp.mkd(cur)
            except error_perm:
                pass
            ftp.cwd(cur)
    ftp.cwd("/")


def upload_file(ftp: FTP, local: Path, remote: str) -> None:
    remote = remote.replace("\\", "/")
    parent = "/".join(remote.split("/")[:-1])
    if parent:
        ensure_remote_dir(ftp, parent)
    with local.open("rb") as fh:
        ftp.storbinary(f"STOR {remote}", fh)


def upload_bytes(ftp: FTP, data: bytes, remote: str) -> None:
    remote = remote.replace("\\", "/")
    parent = "/".join(remote.split("/")[:-1])
    if parent:
        ensure_remote_dir(ftp, parent)
    from io import BytesIO

    ftp.storbinary(f"STOR {remote}", BytesIO(data))


def default_subdir(project_root: Path) -> str:
    name = project_root.name.strip().lower().replace(" ", "-")
    mapping = {
        "shiv": "apps/shiv",
        "userstory-converter-bilkul": "apps/userstory-converter",
        "uts-test-automation-suite": "apps/uts",
    }
    return mapping.get(name, f"apps/{name}")


def connect_ftp(cfg: dict[str, str]) -> FTP:
    host = cfg["FTP_HOST"]
    port = int(cfg.get("FTP_PORT", "21") or "21")
    ftp = FTP()
    ftp.connect(host, port, timeout=60)
    ftp.login(cfg["FTP_USER"], cfg["FTP_PASS"])
    ftp.set_pasv(True)
    return ftp


def publish_alive(ftp: FTP, remote_base: str, project_name: str, file_count: int) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    body = f"""<?php
header('Content-Type: text/plain; charset=utf-8');
echo "OK\\n";
echo "project={project_name}\\n";
echo "files={file_count}\\n";
echo "deployed_at={now}\\n";
echo "note=FTP mirror only; Python services need SSH/VPS to run.\\n";
"""
    remote = f"{remote_base}/alive.php"
    upload_bytes(ftp, body.encode("utf-8"), remote)
    return remote


def deploy_once(
    root: Path,
    cfg: dict[str, str],
    remote_base: str,
    *,
    changed_only: bool,
    dry_run: bool,
) -> int:
    state = load_state(root)
    prev = state.get("files") or {}
    files = list(iter_files(root))
    to_upload: list[Path] = []
    new_state_files: dict[str, str] = dict(prev)

    for rel in files:
        key = rel.as_posix()
        fp = file_fingerprint(root / rel)
        if (not changed_only) or prev.get(key) != fp:
            to_upload.append(rel)
            new_state_files[key] = fp

    # drop deleted locals from state
    live_keys = {rel.as_posix() for rel in files}
    new_state_files = {k: v for k, v in new_state_files.items() if k in live_keys}

    print(f"Project : {root}")
    print(f"Target  : ftp://{cfg['FTP_HOST']}:{cfg.get('FTP_PORT', '21')}{remote_base}")
    print(f"Scan    : {len(files)} files | upload: {len(to_upload)}"
          f"{' (changed only)' if changed_only else ' (full)'}")

    if dry_run:
        for rel in to_upload[:40]:
            print("  would upload:", rel.as_posix())
        if len(to_upload) > 40:
            print(f"  ... and {len(to_upload) - 40} more")
        return 0

    if not to_upload and changed_only:
        print("No changes.")
        return 0

    ftp = connect_ftp(cfg)
    ok = 0
    try:
        for i, rel in enumerate(to_upload, 1):
            local = root / rel
            remote = f"{remote_base}/{rel.as_posix()}"
            try:
                upload_file(ftp, local, remote)
                ok += 1
                if i % 25 == 0 or i == len(to_upload):
                    print(f"  uploaded {i}/{len(to_upload)}")
            except Exception as exc:  # noqa: BLE001
                print(f"  FAIL {rel}: {exc}")

        alive = publish_alive(ftp, remote_base, root.name, len(files))
        print(f"Alive   : {alive}")
    finally:
        try:
            ftp.quit()
        except Exception:
            pass

    state["files"] = new_state_files
    state["last_deploy"] = datetime.now(timezone.utc).isoformat()
    save_state(root, state)

    print(f"Done: {ok}/{len(to_upload)} files -> {remote_base}")
    public = cfg.get("FTP_PUBLIC_BASE", "https://onewayride.cab").rstrip("/")
    sub = remote_base.split("/public_html/", 1)[-1] if "/public_html/" in remote_base else remote_base.lstrip("/")
    print(f"Open    : {public}/{sub}/alive.php")
    print("NOTE    : This FTP host has no SSH — code is mirrored, not executed as Python.")
    return 0 if ok == len(to_upload) else 2


def watch_loop(root: Path, cfg: dict[str, str], remote_base: str, interval: float) -> int:
    print(f"Watching {root} every {interval:.0f}s  (Ctrl+C to stop)")
    # full sync first
    code = deploy_once(root, cfg, remote_base, changed_only=False, dry_run=False)
    if code != 0:
        return code
    try:
        while True:
            time.sleep(interval)
            deploy_once(root, cfg, remote_base, changed_only=True, dry_run=False)
    except KeyboardInterrupt:
        print("\nStopped watching.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy / auto-upload project via FTP")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--watch", action="store_true", help="Auto-upload on file changes")
    parser.add_argument("--interval", type=float, default=8.0, help="Watch poll seconds")
    parser.add_argument("--changed-only", action="store_true", help="Upload only changed files")
    parser.add_argument("--remote-subdir", default="")
    parser.add_argument("--project-root", default="")
    args = parser.parse_args()

    root = Path(args.project_root).resolve() if args.project_root else Path(__file__).resolve().parent
    env_path = find_ftp_env(root)
    cfg = load_env(env_path)

    host = cfg.get("FTP_HOST", "").strip()
    user = cfg.get("FTP_USER", "").strip()
    password = cfg.get("FTP_PASS", "")
    remote_root = (cfg.get("FTP_REMOTE_ROOT") or "/public_html").rstrip("/")

    if not host or not user or not password:
        print("ERROR: FTP_HOST / FTP_USER / FTP_PASS missing in", env_path)
        return 1

    cfg["FTP_HOST"] = host
    cfg["FTP_USER"] = user
    cfg["FTP_PASS"] = password

    sub = (args.remote_subdir or cfg.get("FTP_REMOTE_SUBDIR") or default_subdir(root)).strip("/")
    remote_base = f"{remote_root}/{sub}".replace("//", "/")

    print(f"Config  : {env_path}")

    if args.watch:
        return watch_loop(root, cfg, remote_base, args.interval)

    return deploy_once(
        root,
        cfg,
        remote_base,
        changed_only=args.changed_only,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
