@echo off
REM Worker start — keep this window open. Restarts if the agent exits.
title UTS Worker Agent
cd /d "%~dp0"
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1

if exist "%~dp0worker.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0worker.env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

if "%UTS_SERVER_URL%"=="" set "UTS_SERVER_URL=http://144.91.113.113:5050"
if "%UTS_WORKER_USERNAME%"=="" set "UTS_WORKER_USERNAME=admin"
if "%UTS_WORKER_PASSWORD%"=="" set "UTS_WORKER_PASSWORD=admin"
if "%UTS_WORKER_BROWSER%"=="" set "UTS_WORKER_BROWSER=chrome"

if exist "%~dp0runtime\python.exe" (
  set "PY=%~dp0runtime\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
  set "PY=%~dp0.venv\Scripts\python.exe"
) else (
  set "PY=python"
)

if not exist "%~dp0web-data" mkdir "%~dp0web-data"

echo.
echo  ============================================================
echo   UTS WORKER  —  keep this window OPEN
echo   Server : %UTS_SERVER_URL%
echo   User   : %UTS_WORKER_USERNAME%
echo   Closing this window disconnects My PC (local).
echo  ============================================================
echo.

:loop
echo [%date% %time%] Worker starting... >> "%~dp0web-data\worker-auto.log"
echo [%date% %time%] Worker starting for %UTS_WORKER_USERNAME% ...
"%PY%" -u "%~dp0worker\agent.py" --server "%UTS_SERVER_URL%" --username "%UTS_WORKER_USERNAME%" --password "%UTS_WORKER_PASSWORD%" --browser "%UTS_WORKER_BROWSER%"
echo.
echo Worker stopped (code %ERRORLEVEL%). Restarting in 8 seconds...
echo Press Ctrl+C to exit.
echo [%date% %time%] Worker exited %ERRORLEVEL% >> "%~dp0web-data\worker-auto.log"
timeout /t 8 /nobreak
goto loop
