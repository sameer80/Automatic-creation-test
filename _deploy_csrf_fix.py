"""Upload CSRF login fix and restart UTS on :5050."""
from __future__ import annotations

import os
import time
import urllib.request
from pathlib import Path

import paramiko

HOST = "144.91.113.113"
USER = "administrator"
PASS = os.environ.get("DEPLOY_PASS") or "odcuts@0505#%#"
LOCAL_ROOT = Path(__file__).resolve().parent
REMOTE_ROOT = r"C:\Software_Automation\UTS-Test-Automation-Suite 3\UTS-Test-Automation-Suite"

FILES = [
    Path("webapp/templates/login.html"),
    Path("webapp/__init__.py"),
    Path("webapp/static/app.js"),
]


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 60) -> str:
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print("CMD:", cmd[:180])
    if out.strip():
        print(out[-3000:])
    if err.strip():
        print("ERR:", err[-1000:])
    return out


def connect() -> paramiko.SSHClient:
    last = None
    for i in range(1, 12):
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            print(f"SSH attempt {i}")
            c.connect(
                HOST,
                username=USER,
                password=PASS,
                timeout=40,
                banner_timeout=180,
                auth_timeout=60,
                allow_agent=False,
                look_for_keys=False,
            )
            print("SSH OK")
            return c
        except Exception as e:  # noqa: BLE001
            last = e
            print(f"retry: {e}")
            try:
                c.close()
            except Exception:
                pass
            time.sleep(2 + i)
    raise SystemExit(f"SSH_FAIL {last}")


def main() -> int:
    client = connect()
    sftp = client.open_sftp()
    for rel in FILES:
        src = LOCAL_ROOT / rel
        dst = str(Path(REMOTE_ROOT) / rel)
        print(f"PUT {rel} -> {dst}")
        sftp.put(str(src), dst)
    sftp.close()

    run(
        client,
        'for /f "tokens=5" %p in (\'netstat -ano ^| findstr :5050 ^| findstr LISTENING\') do taskkill /F /PID %p',
    )
    time.sleep(2)
    run(client, "schtasks /Run /TN UTS_StartNow")

    for i in range(20):
        time.sleep(3)
        out = run(client, "netstat -ano | findstr :5050 | findstr LISTENING", timeout=20)
        if "LISTENING" in out:
            print(f"bound after {(i + 1) * 3}s")
            break

    time.sleep(2)
    run(
        client,
        "powershell -NoProfile -Command \""
        "try { $r=Invoke-WebRequest http://127.0.0.1:5050/login -UseBasicParsing -TimeoutSec 12; "
        "if ($r.Content -match 'name=\\\"_csrf_token\\\"') { 'HIDDEN_OK' } else { 'HIDDEN_MISS' }; "
        "Write-Output ('STATUS=' + $r.StatusCode) } catch { $_.Exception.Message }\"",
        timeout=40,
    )
    client.close()

    # External verify: GET has hidden field; POST with token should not be CSRF 400
    req = urllib.request.Request(f"http://{HOST}:5050/login")
    with urllib.request.urlopen(req, timeout=20) as r:
        body = r.read().decode("utf-8", "replace")
        cookie = r.headers.get("Set-Cookie", "")
    print("EXT GET has_hidden=", 'name="_csrf_token"' in body)
    import re

    m = re.search(r'name="_csrf_token"\s+value="([^"]+)"', body)
    token = m.group(1) if m else ""
    session_cookie = ""
    if "session=" in cookie:
        session_cookie = cookie.split(";")[0]
    import urllib.parse

    data = urllib.parse.urlencode(
        {"username": "x", "password": "y", "_csrf_token": token}
    ).encode()
    post = urllib.request.Request(
        f"http://{HOST}:5050/login",
        data=data,
        method="POST",
        headers={"Cookie": session_cookie, "Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(post, timeout=20) as r2:
            print("EXT POST status", r2.status, "(expected 401 page or 200 with flash)")
            print(r2.read(200))
    except urllib.error.HTTPError as e:
        print("EXT POST HTTPError", e.code)
        err_body = e.read().decode("utf-8", "replace")
        if "CSRF" in err_body or "Bad Request" in err_body:
            print("STILL_CSRF_FAIL")
            print(err_body[:300])
            return 1
        print("non-csrf error body ok-ish:", err_body[:200])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
