@echo off
echo ========================================
echo Reiniciando Servidor de Desarrollo
echo ========================================
echo.
echo Limpiando cache de Vite...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache eliminado exitosamente
) else (
    echo No se encontro cache de Vite
)
echo.
echo Iniciando servidor de desarrollo...
echo.
npm run dev
