@echo off
chcp 65001 >nul 2>nul
REM ============================================
REM  OpenClaw Portable Launcher (Windows Batch)
REM  Usage: run_openclaw.bat [args]
REM  Example: run_openclaw.bat --version
REM           run_openclaw.bat doctor
REM           run_openclaw.bat gateway run
REM ============================================

set "SCRIPT_DIR=%~dp0"
set "OPENCLAW_DIR=%SCRIPT_DIR%openclaw"

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 22.16+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Check OpenClaw
if not exist "%OPENCLAW_DIR%\openclaw.mjs" (
    echo [ERROR] OpenClaw not found in openclaw directory
    pause
    exit /b 1
)

REM Run OpenClaw
node "%OPENCLAW_DIR%\openclaw.mjs" %*
