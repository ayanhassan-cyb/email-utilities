@echo off
title Email Pre-Send Inspector
cd /d "%~dp0"

echo ========================================
echo   Email Pre-Send Inspector
echo ========================================
echo.

where py >nul 2>&1
if %errorlevel%==0 (
    set PYTHON_CMD=py
) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
        set PYTHON_CMD=python
    ) else (
        echo Python was not found.
        echo Install Python 3 from https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

echo Installing/checking dependencies...
%PYTHON_CMD% -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
)

echo.
echo Starting server...
echo Open http://127.0.0.1:5000 in your browser.
echo Press Ctrl+C to stop the server.
echo.

start "" http://127.0.0.1:5000
%PYTHON_CMD% app.py

pause
