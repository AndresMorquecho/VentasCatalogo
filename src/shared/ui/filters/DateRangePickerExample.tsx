/**
 * EJEMPLO DE USO: DateRangePicker
 * 
 * Este archivo muestra cómo usar el DateRangePicker en diferentes escenarios
 */

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker, FilterContainer } from '@/shared/ui/filters';

// ============================================
// EJEMPLO 1: Uso Básico
// ============================================
export function BasicExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
    />
  );
}

// ============================================
// EJEMPLO 2: Con FilterContainer
// ============================================
export function WithFilterContainerExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState('');

  const hasFilters = dateRange?.from || search;

  const handleClear = () => {
    setDateRange(undefined);
    setSearch('');
  };

  return (
    <FilterContainer
      onClearFilters={handleClear}
      hasActiveFilters={!!hasFilters}
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar..."
        className="flex-1"
      />
      
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="flex-1"
      />
    </FilterContainer>
  );
}

// ============================================
// EJEMPLO 3: Integración con TanStack Query
// ============================================
import { useQuery } from '@tanstack/react-query';

interface Filters {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export function WithTanStackQueryExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState('');

  // Convertir DateRange a formato de API (YYYY-MM-DD)
  const filters: Filters = {
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    search: search || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  });

  return (
    <div>
      <FilterContainer
        onClearFilters={() => {
          setDateRange(undefined);
          setSearch('');
        }}
        hasActiveFilters={!!(dateRange?.from || search)}
      >
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          label="Periodo"
          className="flex-1"
        />
      </FilterContainer>

      {isLoading ? (
        <div>Cargando...</div>
      ) : (
        <div>Resultados: {data?.length}</div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 4: Migración desde DateRangeFilter
// ============================================

// ANTES (dos inputs separados):
/*
import { DateRangeFilter } from '@/shared/ui/filters';

const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');

<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
*/

// DESPUÉS (un solo calendario):
export function MigrationExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Para usar con API que espera strings YYYY-MM-DD:
  const startDate = dateRange?.from?.toISOString().split('T')[0];
  const endDate = dateRange?.to?.toISOString().split('T')[0];

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
    />
  );
}

// ============================================
// EJEMPLO 5: Con Estado Inicial
// ============================================
export function WithInitialValueExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1), // 1 de enero 2024
    to: new Date(2024, 0, 31),  // 31 de enero 2024
  });

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
      label="Periodo del Reporte"
    />
  );
}

// ============================================
// EJEMPLO 6: Conversión desde/hacia strings
// ============================================
export function StringConversionExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Convertir desde strings de API a DateRange
  const loadFromAPI = (startDate: string, endDate: string) => {
    setDateRange({
      from: new Date(startDate),
      to: new Date(endDate),
    });
  };

  // Convertir desde DateRange a strings para API
  const saveToAPI = () => {
    if (dateRange?.from && dateRange?.to) {
      const payload = {
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0],
      };
      console.log('Enviando a API:', payload);
    }
  };

  return (
    <div>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />
      <button onClick={saveToAPI}>Guardar</button>
      <button onClick={() => loadFromAPI('2024-01-01', '2024-01-31')}>
        Cargar Enero 2024
      </button>
    </div>
  );
}

// Mock function para el ejemplo
async function fetchOrders(filters: Filters) {
  return [];
}
