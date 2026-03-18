@echo off
echo Limpiando cache de Vite...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist
echo Cache limpiada!
echo.
echo Reiniciando servidor de desarrollo...
npm run dev
