# Componentes de Filtros Compartidos

Componentes estandarizados para filtros en toda la aplicación. Todos los componentes siguen el mismo sistema de diseño con estilos consistentes.

## Componentes Disponibles

### FilterContainer

Contenedor estándar para grupos de filtros con botón de limpiar integrado.

```tsx
import { FilterContainer } from '@/shared/ui/filters';

<FilterContainer
  onClearFilters={handleClear}
  hasActiveFilters={hasFilters}
>
  {/* Tus filtros aquí */}
</FilterContainer>
```

**Props:**
- `children`: ReactNode - Contenido del contenedor
- `onClearFilters?`: () => void - Callback para limpiar filtros
- `hasActiveFilters?`: boolean - Si hay filtros activos (muestra botón limpiar)
- `className?`: string - Clases CSS adicionales

---

### BrandFilter

Filtro de marca con búsqueda integrada usando Select de shadcn/ui.

```tsx
import { BrandFilter } from '@/shared/ui/filters';

<BrandFilter
  brands={brands}
  value={selectedBrandId}
  onChange={(id) => setSelectedBrandId(id)}
/>
```

**Props:**
- `brands`: Brand[] - Array de marcas `{ id: string, name: string }`
- `value?`: string - ID de la marca seleccionada
- `onChange`: (brandId: string | undefined) => void - Callback al cambiar
- `label?`: string - Etiqueta del filtro (default: "Marca")
- `placeholder?`: string - Placeholder (default: "Todas las marcas")
- `className?`: string - Clases CSS adicionales
- `showLabel?`: boolean - Mostrar etiqueta (default: true)

---

### ClientFilter

Filtro de cliente con búsqueda por nombre o cédula.

```tsx
import { ClientFilter } from '@/shared/ui/filters';

<ClientFilter
  clients={clients}
  value={selectedClientId}
  onChange={(id) => setSelectedClientId(id)}
/>
```

**Props:**
- `clients`: Client[] - Array de clientes `{ id: string, firstName: string, identificationNumber: string }`
- `value?`: string - ID del cliente seleccionado
- `onChange`: (clientId: string | undefined) => void - Callback al cambiar
- `label?`: string - Etiqueta del filtro (default: "Cliente")
- `placeholder?`: string - Placeholder (default: "Buscar cliente...")
- `className?`: string - Clases CSS adicionales
- `showLabel?`: boolean - Mostrar etiqueta (default: true)

---

### SearchFilter

Filtro de búsqueda genérico con icono.

```tsx
import { SearchFilter } from '@/shared/ui/filters';

<SearchFilter
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar por nombre..."
/>
```

**Props:**
- `value`: string - Valor actual de búsqueda
- `onChange`: (value: string) => void - Callback al cambiar
- `placeholder?`: string - Placeholder (default: "Buscar...")
- `label?`: string - Etiqueta del filtro (default: "Buscar")
- `className?`: string - Clases CSS adicionales
- `showLabel?`: boolean - Mostrar etiqueta (default: true)

---

### DateRangeFilter (LEGACY)

⚠️ **DEPRECADO** - Usa `DateRangePicker` en su lugar para una mejor UX.

Filtro de rango de fechas con dos inputs separados.

```tsx
import { DateRangeFilter } from '@/shared/ui/filters';

<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
```

**Props:**
- `startDate?`: string - Fecha inicio (formato YYYY-MM-DD)
- `endDate?`: string - Fecha fin (formato YYYY-MM-DD)
- `onStartDateChange`: (date: string) => void - Callback fecha inicio
- `onEndDateChange`: (date: string) => void - Callback fecha fin
- `startLabel?`: string - Etiqueta inicio (default: "Fecha Inicio")
- `endLabel?`: string - Etiqueta fin (default: "Fecha Fin")
- `className?`: string - Clases CSS adicionales
- `showLabels?`: boolean - Mostrar etiquetas (default: true)

---

### DateRangePicker (RECOMENDADO)

✨ **NUEVO** - Selector de rango de fechas con calendario interactivo.

```tsx
import { DateRangePicker } from '@/shared/ui/filters';
import type { DateRange } from 'react-day-picker';

const [dateRange, setDateRange] = useState<DateRange | undefined>();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

**Props:**
- `value?`: DateRange - Rango seleccionado `{ from?: Date, to?: Date }`
- `onChange`: (range: DateRange | undefined) => void - Callback al cambiar
- `label?`: string - Etiqueta del filtro (default: "Rango de Fechas")
- `placeholder?`: string - Placeholder (default: "Seleccionar rango")
- `className?`: string - Clases CSS adicionales
- `showLabel?`: boolean - Mostrar etiqueta (default: true)
- `disabled?`: boolean - Deshabilitar el picker (default: false)

**Características:**
- ✅ Un solo calendario interactivo (no dos inputs separados)
- ✅ Selección visual de rango (click inicio → click fin)
- ✅ Rango resaltado visualmente
- ✅ Botón para limpiar el rango
- ✅ Formato de fecha en español
- ✅ Responsive y mobile-friendly
- ✅ Cierre automático al seleccionar ambas fechas

**Conversión a formato API:**
```tsx
const startDate = dateRange?.from?.toISOString().split('T')[0]; // "2024-03-01"
const endDate = dateRange?.to?.toISOString().split('T')[0];     // "2024-03-10"
```

**Integración con TanStack Query:**
```tsx
const [dateRange, setDateRange] = useState<DateRange | undefined>();

const filters = {
  startDate: dateRange?.from?.toISOString().split('T')[0],
  endDate: dateRange?.to?.toISOString().split('T')[0],
};

const { data } = useQuery({
  queryKey: ['orders', filters],
  queryFn: () => fetchOrders(filters),
});
```

---

## Ejemplo Completo

```tsx
import { useState } from 'react';
import { 
  FilterContainer, 
  BrandFilter, 
  ClientFilter, 
  SearchFilter,
  DateRangeFilter 
} from '@/shared/ui/filters';

function MyComponent() {
  const [brandId, setBrandId] = useState<string>();
  const [clientId, setClientId] = useState<string>();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const hasFilters = brandId || clientId || search || startDate || endDate;

  const handleClear = () => {
    setBrandId(undefined);
    setClientId(undefined);
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <FilterContainer
      onClearFilters={handleClear}
      hasActiveFilters={hasFilters}
    >
      <BrandFilter
        brands={brands}
        value={brandId}
        onChange={setBrandId}
        className="flex-1"
      />
      
      <ClientFilter
        clients={clients}
        value={clientId}
        onChange={setClientId}
        className="flex-1"
      />
      
      <SearchFilter
        value={search}
        onChange={setSearch}
        className="flex-1"
      />
      
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        className="flex-1"
      />
    </FilterContainer>
  );
}
```

## Estilos Consistentes

Todos los componentes usan:
- Altura: `h-9` (36px)
- Tamaño de texto: `text-sm`
- Border radius: `rounded-lg`
- Border color: `border-slate-200`
- Focus ring: `focus:ring-2 focus:ring-monchito-purple/20`
- Etiquetas: `text-xs font-medium text-slate-700`

## Migración desde Filtros Antiguos

### Migración de DateRangeFilter a DateRangePicker

**Antes (dos inputs separados):**
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

**Después (un solo calendario):**
```tsx
import type { DateRange } from 'react-day-picker';

const [dateRange, setDateRange] = useState<DateRange | undefined>();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>

// Para usar con API:
const startDate = dateRange?.from?.toISOString().split('T')[0];
const endDate = dateRange?.to?.toISOString().split('T')[0];
```

### Migración de Filtros Personalizados

Si tienes filtros personalizados, reemplázalos con estos componentes:

**Antes:**
```tsx
<div className="mb-4 p-4 bg-slate-50 rounded-lg">
  <Input placeholder="Buscar marca..." />
  {/* Lógica de búsqueda manual */}
</div>
```

**Después:**
```tsx
<FilterContainer hasActiveFilters={hasFilters} onClearFilters={handleClear}>
  <BrandFilter brands={brands} value={brandId} onChange={setBrandId} />
</FilterContainer>
```

## Instalación de Dependencias

Para usar DateRangePicker, necesitas instalar:

```bash
npm install react-day-picker
```

O si usas yarn:

```bash
yarn add react-day-picker
```

La librería `date-fns` ya está instalada en el proyecto.
