@echo off
setlocal
cd /d "%~dp0"
echo Deploying UTS via FTP...
python "%~dp0deploy_ftp.py" %*
if errorlevel 1 pause
endlocal
