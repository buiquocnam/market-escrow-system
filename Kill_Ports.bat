@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   KIEM TRA VA DONG CAC PORT DANG BI CHIEM
echo ==========================================

set PORTS=3000 3001 5000

for %%p in (%PORTS%) do (
    echo Dang quet port %%p...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R /C:":%%p "') do (
        echo found PID %%a on port %%p. Dang dong...
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo Dang dong tat ca cac tien trinh Node.exe...
taskkill /F /IM node.exe /T 2>nul

echo.
echo Kiem tra lai port 3000...
netstat -aon | findstr :3000

echo ==========================================
echo   HOAN THANH!
echo ==========================================
pause
