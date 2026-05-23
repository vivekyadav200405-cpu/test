@echo off
REM ============================================================
REM  push.bat — Double-click to push to GitHub
REM  (Calls push.ps1 with default commit message)
REM ============================================================

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0push.ps1" %*
pause
