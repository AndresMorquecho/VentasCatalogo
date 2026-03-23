#!/bin/bash

# Script de verificación para DateRangePicker
# Ejecutar: bash verify-daterangepicker.sh

echo "🔍 Verificando instalación de DateRangePicker..."
echo ""

# Verificar que react-day-picker esté instalado
echo "1. Verificando react-day-picker en package.json..."
if grep -q "react-day-picker" package.json; then
    echo "   ✅ react-day-picker encontrado en package.json"
else
    echo "   ❌ react-day-picker NO encontrado en package.json"
    echo "   Ejecuta: npm install react-day-picker"
    exit 1
fi

# Verificar que los estilos estén importados en main.tsx
echo ""
echo "2. Verificando imports de CSS en main.tsx..."
if grep -q "react-day-picker/dist/style.css" src/main.tsx; then
    echo "   ✅ Estilos de react-day-picker importados"
else
    echo "   ❌ Estilos de react-day-picker NO importados"
    echo "   Agrega: import 'react-day-picker/dist/style.css';"
    exit 1
fi

if grep -q "@/shared/ui/filters/date-range-picker.css" src/main.tsx; then
    echo "   ✅ Estilos personalizados importados"
else
    echo "   ❌ Estilos personalizados NO importados"
    echo "   Agrega: import '@/shared/ui/filters/date-range-picker.css';"
    exit 1
fi

# Verificar que el componente DateRangePicker exista
echo ""
echo "3. Verificando componente DateRangePicker..."
if [ -f "src/shared/ui/filters/DateRangePicker.tsx" ]; then
    echo "   ✅ DateRangePicker.tsx existe"
else
    echo "   ❌ DateRangePicker.tsx NO existe"
    exit 1
fi

# Verificar que los estilos CSS existan
echo ""
echo "4. Verificando archivo de estilos..."
if [ -f "src/shared/ui/filters/date-range-picker.css" ]; then
    echo "   ✅ date-range-picker.css existe"
else
    echo "   ❌ date-range-picker.css NO existe"
    exit 1
fi

# Verificar que ReceptionHistory use DateRangePicker
echo ""
echo "5. Verificando migración de ReceptionHistory..."
if grep -q "DateRangePicker" src/features/reception-batch/ui/ReceptionHistory.tsx; then
    echo "   ✅ ReceptionHistory migrado a DateRangePicker"
else
    echo "   ⚠️  ReceptionHistory NO usa DateRangePicker"
fi

echo ""
echo "✅ Verificación completada!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ejecuta: npm run dev"
echo "   2. Navega a Historial de Recepción"
echo "   3. Prueba el selector de fechas"
echo ""
echo "📚 Documentación:"
echo "   - DATERANGEPICKER_SETUP.md"
echo "   - MIGRACION_COMPLETADA.md"
echo "   - src/shared/ui/filters/README.md"
echo ""
