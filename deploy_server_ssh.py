"""Deploy local code changes to the live UTS server and restart it.

Usage:
    python deploy_server_ssh.py

Recursively uploads the project source tree (excluding venvs, caches,
generated/runtime data, and local secrets) to the remote UTS install via
SFTP, then restarts the web app through the `UTS_StartNow` scheduled task
and verifies it comes back up with an HTTP 200 on /login.

NOTE: kept WITHOUT a leading underscore so it doesn't get swept up by
future "delete temporary `_`-prefixed scripts" cleanups — this is a
permanent dev tool, not a throwaway diagnostic script.
"""

from __future__ import annotations

import time
from pathlib import Path

import paramiko

HOST = "144.91.113.113"
USER = "administrator"
PASS = "odcuts@0505#%#"
LOCAL_ROOT = Path(__file__).resolve().parent
REMOTE_ROOT = r"C:\Software_Automation\UTS-Test-Automation-Suite 3\UTS-Test-Automation-Suite"

# Directory names to skip anywhere in the tree.
EXCLUDE_DIRS = {
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    ".pytest_cache",
    "generated",
    "logs",
    "reports",
    "web-data",
    "alm-output",
    "_dev_pkg_build",
    "node_modules",
    ".cursor",
}

# Specific relative files to skip (secrets / local-only).
EXCLUDE_FILES = {
    ".env.local",
}

INCLUDE_SUFFIXES = {
    ".py",
    ".html",
    ".css",
    ".js",
    ".json",
    ".txt",
    ".md",
    ".cfg",
    ".ini",
    ".toml",
}


def iter_local_files():
    for path in LOCAL_ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(LOCAL_ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if str(rel) in EXCLUDE_FILES or rel.name.startswith("_deploy") or rel.name.startswith("_check") or rel.name.startswith("_run_remote") or rel.name.startswith("_verify") or rel.name.startswith("_full_restart") or rel.name.startswith("_direct_run") or rel.name.startswith("_quick_http") or rel.name.startswith("_deep_check") or rel.name.startswith("_dbcheck") or rel.name.startswith("_curl_test") or rel.name.startswith("_tail_log") or rel.name.startswith("_read_log") or rel.name.startswith("_restart_uts"):
            continue
        if path.suffix.lower() not in INCLUDE_SUFFIXES:
            continue
        yield rel


def ensure_remote_dir(sftp: paramiko.SFTPClient, remote_dir: str) -> None:
    parts = Path(remote_dir).parts
    cur = parts[0]
    for part in parts[1:]:
        cur = str(Path(cur) / part)
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            try:
                sftp.mkdir(cur)
            except OSError:
                pass


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print("CMD:", cmd)
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)
    return out, err


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting SSH...")
    client.connect(HOST, username=USER, password=PASS, timeout=30, allow_agent=False, look_for_keys=False)
    print("SSH OK")

    sftp = client.open_sftp()
    try:
        sftp.stat(REMOTE_ROOT)
    except Exception as exc:  # noqa: BLE001
        print("Remote root missing:", exc)
        return 2

    uploaded = 0
    made_dirs: set[str] = set()
    for rel in iter_local_files():
        src = LOCAL_ROOT / rel
        dst = str(Path(REMOTE_ROOT) / rel)
        dst_dir = str(Path(dst).parent)
        if dst_dir not in made_dirs:
            ensure_remote_dir(sftp, dst_dir)
            made_dirs.add(dst_dir)
        sftp.put(str(src), dst)
        uploaded += 1
    print(f"Uploaded {uploaded} files")
    sftp.close()

    print("Restarting server...")
    run(client, 'for /f "tokens=5" %p in (\'netstat -ano ^| findstr :5050 ^| findstr LISTENING\') do taskkill /F /PID %p')
    time.sleep(2)
    run(client, "schtasks /Run /TN UTS_StartNow")

    for i in range(15):
        time.sleep(4)
        out, _ = run(client, "netstat -ano | findstr :5050 | findstr LISTENING", timeout=20)
        if "LISTENING" in out:
            print(f"Port bound after {(i + 1) * 4}s")
            break

    time.sleep(3)
    run(
        client,
        "powershell -Command \"try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5050/login' "
        "-UseBasicParsing -TimeoutSec 10; Write-Output ('STATUS: ' + $r.StatusCode) } "
        "catch { Write-Output ('ERROR: ' + $_.Exception.Message) }\"",
        timeout=20,
    )

    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
