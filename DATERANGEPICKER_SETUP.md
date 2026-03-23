# DateRangePicker - Guía de Instalación y Uso

## 📦 Instalación

### 1. Instalar react-day-picker

```bash
npm install react-day-picker
```

O con yarn:

```bash
yarn add react-day-picker
```

### 2. Importar estilos CSS

Agrega el import de estilos en tu archivo principal (ej: `main.tsx` o `App.tsx`):

```tsx
import 'react-day-picker/dist/style.css';
import '@/shared/ui/filters/date-range-picker.css';
```

## 🚀 Uso Básico

### Ejemplo Simple

```tsx
import { useState } from 'react';
import { DateRangePicker } from '@/shared/ui/filters';
import type { DateRange } from 'react-day-picker';

function MyComponent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
      label="Periodo"
      placeholder="Seleccionar fechas"
    />
  );
}
```

## 🔄 Migración desde DateRangeFilter

### Antes (dos inputs separados)

```tsx
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');

<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
```

### Después (un solo calendario)

```tsx
import type { DateRange } from 'react-day-picker';

const [dateRange, setDateRange] = useState<DateRange | undefined>();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

### Conversión para API

Si tu API espera strings en formato `YYYY-MM-DD`:

```tsx
const startDate = dateRange?.from?.toISOString().split('T')[0];
const endDate = dateRange?.to?.toISOString().split('T')[0];
```

## 🔌 Integración con TanStack Query

### Ejemplo Completo

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker, FilterContainer } from '@/shared/ui/filters';
import type { DateRange } from 'react-day-picker';

interface Filters {
  startDate?: string;
  endDate?: string;
  search?: string;
}

function OrdersPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState('');

  // Convertir DateRange a formato de API
  const filters: Filters = {
    startDate: dateRange?.from?.toISOString().split('T')[0],
    endDate: dateRange?.to?.toISOString().split('T')[0],
    search: search || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  });

  const handleClearFilters = () => {
    setDateRange(undefined);
    setSearch('');
  };

  return (
    <div>
      <FilterContainer
        onClearFilters={handleClearFilters}
        hasActiveFilters={!!(dateRange?.from || search)}
      >
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          label="Periodo"
          className="flex-1"
        />
        
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="flex-1"
        />
      </FilterContainer>

      {isLoading ? (
        <div>Cargando...</div>
      ) : (
        <div>
          {data?.map(order => (
            <div key={order.id}>{order.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 📝 Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `DateRange \| undefined` | - | Rango seleccionado `{ from?: Date, to?: Date }` |
| `onChange` | `(range: DateRange \| undefined) => void` | - | Callback al cambiar el rango |
| `label` | `string` | "Rango de Fechas" | Etiqueta del filtro |
| `placeholder` | `string` | "Seleccionar rango" | Texto cuando no hay selección |
| `className` | `string` | "" | Clases CSS adicionales |
| `showLabel` | `boolean` | `true` | Mostrar/ocultar etiqueta |
| `disabled` | `boolean` | `false` | Deshabilitar el picker |

## ✨ Características

- ✅ **Un solo calendario interactivo** - No más dos inputs separados
- ✅ **Selección visual de rango** - Click en fecha inicio → click en fecha fin
- ✅ **Rango resaltado** - El rango seleccionado se muestra visualmente
- ✅ **Botón limpiar** - Limpia el rango con un click
- ✅ **Formato en español** - Fechas y meses en español
- ✅ **Responsive** - Funciona en mobile y desktop
- ✅ **Cierre automático** - Se cierra al seleccionar ambas fechas
- ✅ **Integración fácil** - Compatible con TanStack Query y otros

## 🎨 Personalización

### Estilos Personalizados

Puedes personalizar los colores editando `date-range-picker.css`:

```css
.date-range-picker {
  --rdp-cell-size: 36px;
  --rdp-accent-color: #8b5cf6; /* Color principal */
  --rdp-background-color: #f1f5f9; /* Color de fondo */
}
```

### Clases CSS Adicionales

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  className="w-full md:w-64"
/>
```

## 🔧 Casos de Uso Comunes

### 1. Filtro de Reportes

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  label="Periodo del Reporte"
  placeholder="Seleccionar periodo"
/>
```

### 2. Filtro de Historial

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  label="Rango de Fechas"
  showLabel={false}
/>
```

### 3. Con Valor Inicial

```tsx
const [dateRange, setDateRange] = useState<DateRange | undefined>({
  from: new Date(2024, 0, 1), // 1 de enero 2024
  to: new Date(2024, 0, 31),  // 31 de enero 2024
});
```

### 4. Cargar desde API

```tsx
// Convertir strings de API a DateRange
const loadFromAPI = (startDate: string, endDate: string) => {
  setDateRange({
    from: new Date(startDate),
    to: new Date(endDate),
  });
};

// Ejemplo: loadFromAPI('2024-01-01', '2024-01-31')
```

## 🐛 Troubleshooting

### El calendario no se muestra

Asegúrate de importar los estilos CSS:

```tsx
import 'react-day-picker/dist/style.css';
```

### Los estilos no se aplican correctamente

Verifica que el archivo `date-range-picker.css` esté importado después de los estilos de react-day-picker.

### El componente no cierra automáticamente

Esto es normal si solo se selecciona una fecha. El calendario se cierra automáticamente solo cuando se seleccionan ambas fechas (inicio y fin).

## 📚 Recursos

- [react-day-picker Documentation](https://react-day-picker.js.org/)
- [date-fns Documentation](https://date-fns.org/)
- [Ejemplos de uso](./DateRangePickerExample.tsx)

## 🎯 Próximos Pasos

1. Instala `react-day-picker`
2. Importa los estilos CSS
3. Reemplaza tus `DateRangeFilter` con `DateRangePicker`
4. Actualiza la lógica de conversión de fechas
5. Prueba en tu aplicación

¡Listo! Ahora tienes un selector de rango de fechas moderno y fácil de usar.
