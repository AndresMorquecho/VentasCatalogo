Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reiniciando Servidor de Desarrollo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Limpiando cache de Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "Cache eliminado exitosamente" -ForegroundColor Green
} else {
    Write-Host "No se encontro cache de Vite" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host ""

npm run dev
