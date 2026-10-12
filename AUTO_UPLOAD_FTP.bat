@echo off
setlocal
cd /d "%~dp0"
title AUTO FTP upload - UTS
echo Auto-upload ON. Saves in this folder upload to FTP automatically.
echo Close this window to stop.
echo.
python "%~dp0deploy_ftp.py" --watch --interval 8
pause
endlocal
