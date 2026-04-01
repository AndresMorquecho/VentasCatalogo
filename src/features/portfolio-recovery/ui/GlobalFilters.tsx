/**
 * Filtros Globales Simplificados y Compactos
 * Solo marca (con selector y búsqueda) y estado de recuperación
 */

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useBrandsList } from '../hooks/useBrandsList';
import { BrandFilter, FilterContainer } from '@/shared/ui/filters';
import type { FilterState } from '@/features/portfolio-recovery/types';

interface GlobalFiltersProps {
  filterState: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onFiltersChangeImmediate: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

// Helper para obtener el label del estado de recuperación
const getRecoveryStatusLabel = (status?: string) => {
  switch (status) {
    case 'HEALTHY':
      return '● Saludable (>50%)';
    case 'WARNING':
      return '● Advertencia (30-50%)';
    case 'CRITICAL':
      return '● Crítico (<30%)';
    default:
      return 'Todos los estados';
  }
};

import { Label } from '@/shared/ui/label';

export function GlobalFilters({
  filterState,
  onFiltersChangeImmediate,
  onClearFilters,
}: GlobalFiltersProps) {
  const { data: brands } = useBrandsList();

  // Encontrar la marca seleccionada por nombre
  const selectedBrandId = useMemo(() => {
    if (!filterState.brandName || !brands) return undefined;
    const brand = brands.find(b => b.name === filterState.brandName);
    return brand?.id;
  }, [filterState.brandName, brands]);

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    (filterState.recoveryStatus && filterState.recoveryStatus !== 'ALL') ||
    (filterState.brandName !== undefined);

  return (
    <FilterContainer
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
    >
      {/* Selector de Marca con Búsqueda */}
      <BrandFilter
        brands={brands || []}
        value={selectedBrandId}
        onChange={(brandId) => {
          if (!brandId) {
            onFiltersChangeImmediate({ brandIds: undefined, brandName: undefined });
          } else {
            const brand = brands?.find(b => b.id === brandId);
            if (brand) {
              onFiltersChangeImmediate({ 
                brandIds: [brandId], 
                brandName: brand.name,
                recoveryStatus: undefined
              });
            }
          }
        }}
        className="w-full sm:flex-1 min-w-[200px]"
      />

      {/* Estado de Recuperación */}
      <div className="w-full sm:w-64">
        <Label className="text-xs font-medium mb-1.5 block text-slate-700">
          Estado
        </Label>
        <Select
          value={filterState.recoveryStatus || 'ALL'}
          onValueChange={(value) => {
            if (value === 'ALL') {
              onFiltersChangeImmediate({ recoveryStatus: undefined });
            } else {
              onFiltersChangeImmediate({ 
                recoveryStatus: value as any,
                brandIds: undefined,
                brandName: undefined
              });
            }
          }}
        >
          <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20">
            <SelectValue placeholder={getRecoveryStatusLabel(filterState.recoveryStatus)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="HEALTHY">● Saludable (&gt;50%)</SelectItem>
            <SelectItem value="WARNING">● Advertencia (30-50%)</SelectItem>
            <SelectItem value="CRITICAL">● Crítico (&lt;30%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </FilterContainer>
  );
}


