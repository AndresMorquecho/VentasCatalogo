@echo off
echo Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared successfully!
) else (
    echo No Vite cache found.
)
echo.
echo Please restart your dev server with: npm run dev
pause
