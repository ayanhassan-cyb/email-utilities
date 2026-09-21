@echo off
title Email Link Checker
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (set PYTHON_CMD=py) else (set PYTHON_CMD=python)
%PYTHON_CMD% -m pip install -r requirements.txt
if errorlevel 1 (
    pause
    exit /b 1
)
start "" http://127.0.0.1:5001
%PYTHON_CMD% app.py
pause

