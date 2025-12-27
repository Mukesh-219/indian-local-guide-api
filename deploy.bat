@echo off
REM Indian Local Guide API - Windows Deployment Script

echo 🚀 Starting deployment preparation for Indian Local Guide API...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

echo [SUCCESS] Node.js version check passed: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    exit /b 1
)

echo [SUCCESS] npm version: 
npm --version

REM Clean previous builds
echo [INFO] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Install dependencies
echo [INFO] Installing dependencies...
npm ci --production=false
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    exit /b 1
)

REM Run tests
echo [INFO] Running tests...
npm test
if errorlevel 1 (
    echo [ERROR] Tests failed. Please fix failing tests before deployment.
    exit /b 1
)

echo [SUCCESS] All tests passed

REM Build the application
echo [INFO] Building application...
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Please check the build errors.
    exit /b 1
)

echo [SUCCESS] Build completed successfully

REM Verify build output
if not exist dist (
    echo [ERROR] Build directory 'dist' not found. Build may have failed.
    exit /b 1
)

if not exist dist\server.js (
    echo [ERROR] Main server file 'dist\server.js' not found. Build may have failed.
    exit /b 1
)

echo [SUCCESS] Build verification passed

REM Create data directory if it doesn't exist
echo [INFO] Creating data directory...
if not exist data mkdir data
echo [SUCCESS] Data directory ready

echo.
echo 🎉 Application is ready for deployment!
echo.
echo 📋 Deployment Options:
echo.
echo 1. 🚂 Railway (Recommended):
echo    - Push to GitHub and connect at railway.app
echo    - Automatic deployment with railway.json config
echo.
echo 2. 🎨 Render:
echo    - Push to GitHub and create service at render.com
echo    - Uses render.yaml configuration
echo.
echo 3. 🟣 Heroku:
echo    - heroku create your-app-name
echo    - git push heroku main
echo.
echo 4. ⚡ Vercel:
echo    - npm i -g vercel
echo    - vercel --prod
echo.
echo 5. 🐳 Docker:
echo    - docker build -t indian-local-guide .
echo    - docker run -p 3000:3000 indian-local-guide
echo.
echo 📚 For detailed instructions, see DEPLOYMENT.md
echo.
echo 🔗 API Endpoints (after deployment):
echo    Health: GET /health
echo    API Info: GET /api
echo    Translation Demo: GET /api/translate/demo
echo    Food Demo: GET /api/food/demo
echo    Culture Demo: GET /api/culture/demo
echo.
echo [SUCCESS] Deployment preparation completed successfully!
echo 🌟 Your Indian Local Guide API is ready to help people explore India!