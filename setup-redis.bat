@echo off
echo Setting up Redis for Windows...
echo.

REM Check if Redis is already running
redis-cli ping >nul 2>&1
if %errorlevel%==0 (
    echo Redis is already running!
    exit /b 0
)

REM Check if Redis is installed
where redis-server >nul 2>&1
if %errorlevel%==0 (
    echo Starting Redis...
    start redis-server
    echo Redis started successfully!
    exit /b 0
)

echo Redis is not installed. Please choose an installation method:
echo.
echo 1. Download Redis for Windows (Recommended)
echo 2. Use Windows Subsystem for Linux (WSL)
echo 3. Use Docker
echo.
echo Instructions:
echo.
echo Option 1 - Download Redis for Windows:
echo   1. Download from: https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip
echo   2. Extract to C:\Redis
echo   3. Run redis-server.exe
echo.
echo Option 2 - Use WSL:
echo   1. Open PowerShell as Administrator
echo   2. Run: wsl --install
echo   3. Restart computer
echo   4. Open WSL terminal and run:
echo      sudo apt update
echo      sudo apt install redis-server
echo      sudo service redis-server start
echo.
echo Option 3 - Use Docker:
echo   1. Make sure Docker Desktop is installed
echo   2. Run: docker run -d -p 6379:6379 redis
echo.
pause