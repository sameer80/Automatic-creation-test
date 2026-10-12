"""Restart live UTS on :5050 (no full upload). Open firewall, run UTS_StartNow, verify /login."""
from __future__ import annotations

import os
import socket
import time
import urllib.request

import paramiko

HOST = "144.91.113.113"
USER = "administrator"
PASS = os.environ.get("DEPLOY_PASS") or "odcuts@0505#%#"
REMOTE_ROOT = r"C:\Software_Automation\UTS-Test-Automation-Suite 3\UTS-Test-Automation-Suite"


def tcp(port: int, timeout: float = 6.0) -> bool:
    s = socket.socket()
    s.settimeout(timeout)
    try:
        s.connect((HOST, port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 60) -> tuple[str, str]:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print("CMD:", cmd[:200])
    if out.strip():
        print(out[-4000:])
    if err.strip():
        print("ERR:", err[-1500:])
    return out, err


def main() -> int:
    print("=== BEFORE ===")
    print("TCP5050", "OK" if tcp(5050) else "FAIL")

    client = None
    last_err = None
    for attempt in range(1, 12):
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            print(f"Connecting SSH attempt={attempt}...")
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
            client = c
            print("SSH OK")
            break
        except Exception as e:
            last_err = e
            print(f"SSH_RETRY {attempt}: {type(e).__name__}: {e}")
            try:
                c.close()
            except Exception:
                pass
            time.sleep(3 + attempt)
    if client is None:
        raise SystemExit(f"SSH_FAIL after retries: {last_err}")

    run(client, f'if exist "{REMOTE_ROOT}\\run_web.py" (echo REMOTE_OK) else (echo REMOTE_MISSING)')
    run(client, f'dir /b "{REMOTE_ROOT}\\RUN-WEB.bat" "{REMOTE_ROOT}\\run_web.py" "{REMOTE_ROOT}\\.venv\\Scripts\\python.exe"')

    # Firewall — all profiles
    run(
        client,
        "powershell -NoProfile -Command \""
        "Try { "
        "$r=Get-NetFirewallRule -DisplayName 'UTS 5050' -EA SilentlyContinue; "
        "if(-not $r){ New-NetFirewallRule -DisplayName 'UTS 5050' -Direction Inbound "
        "-Protocol TCP -LocalPort 5050 -Action Allow -Profile Any | Out-Null; 'FW_CREATED' } "
        "else { Set-NetFirewallRule -DisplayName 'UTS 5050' -Enabled True -Action Allow -Profile Any; 'FW_UPDATED' } "
        "} Catch { netsh advfirewall firewall delete rule name='UTS 5050' | Out-Null; "
        "netsh advfirewall firewall add rule name='UTS 5050' dir=in action=allow protocol=TCP localport=5050; 'FW_NETSH' }"
        "\"",
        timeout=90,
    )

    # Kill old listener
    run(
        client,
        'for /f "tokens=5" %p in (\'netstat -ano ^| findstr :5050 ^| findstr LISTENING\') do taskkill /F /PID %p',
    )
    time.sleep(2)

    # Prefer scheduled task used by prior working deploys
    out, _ = run(client, "schtasks /Query /TN UTS_StartNow /FO LIST /V", timeout=40)
    if "ERROR:" in out.upper() and "cannot" in out.lower():
        print("Task missing — starting RUN-WEB.bat directly")
        run(
            client,
            "powershell -NoProfile -Command \""
            f"$p=Start-Process -FilePath '{REMOTE_ROOT}\\RUN-WEB.bat' "
            f"-WorkingDirectory '{REMOTE_ROOT}' -WindowStyle Hidden -PassThru; "
            "Write-Output ('STARTED_PID=' + $p.Id)"
            "\"",
            timeout=60,
        )
    else:
        run(client, "schtasks /Run /TN UTS_StartNow", timeout=40)

    bound = False
    for i in range(20):
        time.sleep(3)
        out, _ = run(client, "netstat -ano | findstr :5050 | findstr LISTENING", timeout=20)
        if "LISTENING" in out:
            print(f"Port bound after {(i + 1) * 3}s")
            bound = True
            break

    if not bound:
        print("Still not bound — direct python start")
        run(
            client,
            "powershell -NoProfile -Command \""
            f"$env:UTS_HOST='0.0.0.0'; $env:UTS_PORT='5050'; $env:UTS_OPEN_BROWSER='false'; "
            f"$py='{REMOTE_ROOT}\\.venv\\Scripts\\python.exe'; "
            f"$p=Start-Process -FilePath $py -ArgumentList '\"{REMOTE_ROOT}\\run_web.py\"' "
            f"-WorkingDirectory '{REMOTE_ROOT}' -WindowStyle Hidden -PassThru "
            f"-RedirectStandardOutput 'C:\\Software_Automation\\uts5050.out' "
            f"-RedirectStandardError 'C:\\Software_Automation\\uts5050.err'; "
            "Write-Output ('DIRECT_PID=' + $p.Id)"
            "\"",
            timeout=60,
        )
        for i in range(15):
            time.sleep(3)
            out, _ = run(client, "netstat -ano | findstr :5050 | findstr LISTENING", timeout=20)
            if "LISTENING" in out:
                print(f"Direct bind after {(i + 1) * 3}s")
                bound = True
                break

    run(
        client,
        "powershell -NoProfile -Command \""
        "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:5050/login' -UseBasicParsing -TimeoutSec 12; "
        "Write-Output ('LOCAL_STATUS=' + $r.StatusCode + ' LEN=' + $r.RawContentLength) } "
        "catch { Write-Output ('LOCAL_ERROR=' + $_.Exception.Message); "
        "if(Test-Path 'C:\\Software_Automation\\uts5050.err'){ Get-Content 'C:\\Software_Automation\\uts5050.err' -Tail 30 } }"
        "\"",
        timeout=40,
    )

    client.close()

    print("=== AFTER EXTERNAL ===")
    print("TCP5050", "OK" if tcp(5050, 8) else "FAIL")
    try:
        with urllib.request.urlopen(f"http://{HOST}:5050/login", timeout=20) as r:
            data = r.read(300)
            print(f"EXT_LOGIN status={r.status} sample={data[:120]!r}")
    except Exception as e:
        print(f"EXT_LOGIN_FAIL {type(e).__name__}: {e}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
