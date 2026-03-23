#!/bin/bash

# Script de instalación para DateRangePicker
# Ejecutar: bash install-daterangepicker.sh

echo "🚀 Instalando DateRangePicker..."
echo ""

# Instalar react-day-picker
echo "📦 Instalando react-day-picker..."
npm install react-day-picker

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Importa los estilos en tu archivo main.tsx o App.tsx:"
echo ""
echo "   import 'react-day-picker/dist/style.css';"
echo "   import '@/shared/ui/filters/date-range-picker.css';"
echo ""
echo "2. Usa el componente:"
echo ""
echo "   import { DateRangePicker } from '@/shared/ui/filters';"
echo "   import { DateRange } from 'react-day-picker';"
echo ""
echo "   const [dateRange, setDateRange] = useState<DateRange | undefined>();"
echo ""
echo "   <DateRangePicker"
echo "     value={dateRange}"
echo "     onChange={setDateRange}"
echo "   />"
echo ""
echo "3. Lee la documentación completa en:"
echo "   - DATERANGEPICKER_SETUP.md"
echo "   - src/shared/ui/filters/README.md"
echo ""
echo "🎉 ¡Listo para usar!"
