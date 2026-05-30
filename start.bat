@echo off
setlocal
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/?v=%RANDOM%"

where python >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=python"
    goto run_server
)

where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    goto run_server
)

echo Python 3 was not found.
echo Install Python 3 or run another local HTTP server in this folder.
echo.
pause
exit /b 1

:run_server
echo Shield Orb Trainer local server
echo Serving folder:
cd
echo.
echo URL: %URL%
echo Press Ctrl+C in this window to stop the server.
echo.

start "" "%URL%"
%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1

echo.
echo Server stopped.
pause
