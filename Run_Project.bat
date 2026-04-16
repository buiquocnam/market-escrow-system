@echo off
color 0A
echo ===================================================
echo     AI + CRYPTO ESCROW MARKETPLACE STARTUP       
echo ===================================================
echo.

echo [0/4] Khoi dong ngrok (Port 5000)...
start "ngrok Tunnel" cmd /k "ngrok http 5000"

echo [1/3] Khoi chay Node.js Backend (Port 5000)...
echo     (Backend se tu dong dang ky webhooks Shopify voi APP_BASE_URL trong .env)
start "Node.js Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/3] Khoi chay Next.js Frontend (Port 3000)...
start "Next.js Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   DA KICH HOAT THANH CONG 3 DICH VU!
echo ===================================================
echo   - Trang chu:  http://localhost:3000
echo   - Backend:    http://localhost:5000
echo   - ngrok UI:   http://localhost:4040
echo ===================================================
echo.
echo   LUU Y: Kiem tra cua so "Node.js Backend" de xac nhan
echo   webhooks Shopify da duoc dang ky thanh cong.
echo   (APP_BASE_URL trong backend\.env phai dung URL ngrok)
echo ===================================================
pause
