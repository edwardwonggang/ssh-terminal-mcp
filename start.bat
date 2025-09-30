@echo off
echo Starting Terminal MCP...
echo.

REM 检查是否已经有服务器在运行
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo Warning: Port 3000 is already in use. Please close the existing server first.
    pause
    exit /b 1
)

echo [1/2] Starting backend server on port 3000...
start "Terminal MCP Server" cmd /k "cd /d %~dp0 && npm run server"

echo [2/2] Waiting for server to start...
timeout /t 3 /nobreak > nul

echo [2/2] Starting frontend client on port 5173...
start "Terminal MCP Client" cmd /k "cd /d %~dp0\client && npm run dev"

echo.
echo ========================================
echo Terminal MCP is starting!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open the browser...
pause > nul

start http://localhost:5173

echo.
echo Application is running!
echo Close the terminal windows to stop the application.
echo.