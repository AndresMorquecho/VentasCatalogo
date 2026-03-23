# Script de verificación para DateRangePicker (PowerShell)
# Ejecutar: .\verify-daterangepicker.ps1

Write-Host "🔍 Verificando instalación de DateRangePicker..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verificar que react-day-picker esté instalado
Write-Host "1. Verificando react-day-picker en package.json..." -ForegroundColor Yellow
if (Select-String -Path "package.json" -Pattern "react-day-picker" -Quiet) {
    Write-Host "   ✅ react-day-picker encontrado en package.json" -ForegroundColor Green
} else {
    Write-Host "   ❌ react-day-picker NO encontrado en package.json" -ForegroundColor Red
    Write-Host "   Ejecuta: npm install react-day-picker" -ForegroundColor Yellow
    $allGood = $false
}

# Verificar que los estilos estén importados en main.tsx
Write-Host ""
Write-Host "2. Verificando imports de CSS en main.tsx..." -ForegroundColor Yellow
if (Select-String -Path "src/main.tsx" -Pattern "react-day-picker/dist/style.css" -Quiet) {
    Write-Host "   ✅ Estilos de react-day-picker importados" -ForegroundColor Green
} else {
    Write-Host "   ❌ Estilos de react-day-picker NO importados" -ForegroundColor Red
    Write-Host "   Agrega: import 'react-day-picker/dist/style.css';" -ForegroundColor Yellow
    $allGood = $false
}

if (Select-String -Path "src/main.tsx" -Pattern "@/shared/ui/filters/date-range-picker.css" -Quiet) {
    Write-Host "   ✅ Estilos personalizados importados" -ForegroundColor Green
} else {
    Write-Host "   ❌ Estilos personalizados NO importados" -ForegroundColor Red
    Write-Host "   Agrega: import '@/shared/ui/filters/date-range-picker.css';" -ForegroundColor Yellow
    $allGood = $false
}

# Verificar que el componente DateRangePicker exista
Write-Host ""
Write-Host "3. Verificando componente DateRangePicker..." -ForegroundColor Yellow
if (Test-Path "src/shared/ui/filters/DateRangePicker.tsx") {
    Write-Host "   ✅ DateRangePicker.tsx existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ DateRangePicker.tsx NO existe" -ForegroundColor Red
    $allGood = $false
}

# Verificar que los estilos CSS existan
Write-Host ""
Write-Host "4. Verificando archivo de estilos..." -ForegroundColor Yellow
if (Test-Path "src/shared/ui/filters/date-range-picker.css") {
    Write-Host "   ✅ date-range-picker.css existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ date-range-picker.css NO existe" -ForegroundColor Red
    $allGood = $false
}

# Verificar que ReceptionHistory use DateRangePicker
Write-Host ""
Write-Host "5. Verificando migración de ReceptionHistory..." -ForegroundColor Yellow
if (Select-String -Path "src/features/reception-batch/ui/ReceptionHistory.tsx" -Pattern "DateRangePicker" -Quiet) {
    Write-Host "   ✅ ReceptionHistory migrado a DateRangePicker" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  ReceptionHistory NO usa DateRangePicker" -ForegroundColor Yellow
}

Write-Host ""
if ($allGood) {
    Write-Host "✅ Verificación completada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Verificación completada con errores" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Ejecuta: npm run dev"
Write-Host "   2. Navega a Historial de Recepción"
Write-Host "   3. Prueba el selector de fechas"
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "   - DATERANGEPICKER_SETUP.md"
Write-Host "   - MIGRACION_COMPLETADA.md"
Write-Host "   - src/shared/ui/filters/README.md"
Write-Host ""
