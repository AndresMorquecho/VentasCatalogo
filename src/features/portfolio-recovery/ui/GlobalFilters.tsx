/**
 * Filtros Globales Simplificados y Compactos
 * Solo marca (con selector y búsqueda) y estado de recuperación
 */

import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useBrandsList } from '../hooks/useBrandsList';
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

export function GlobalFilters({
  filterState,
  onFiltersChangeImmediate,
  onClearFilters,
}: GlobalFiltersProps) {
  const { data: brands } = useBrandsList();
  const [brandSearch, setBrandSearch] = useState('');

  // Encontrar la marca seleccionada por nombre
  const selectedBrand = useMemo(() => {
    if (!filterState.brandName || !brands) return null;
    return brands.find(b => b.name === filterState.brandName);
  }, [filterState.brandName, brands]);

  // Obtener el nombre de la marca seleccionada
  const selectedBrandName = selectedBrand?.name || 'Todas las marcas';

  // Filtrar marcas según búsqueda
  const filteredBrands = brands?.filter(brand => 
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  ) || [];

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    (filterState.recoveryStatus && filterState.recoveryStatus !== 'ALL') ||
    (filterState.brandName !== undefined);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Selector de Marca con Búsqueda */}
        <div className="flex-1">
          <Select
            value={selectedBrand?.id || 'ALL'}
            onValueChange={(value) => {
              if (value === 'ALL') {
                // Limpiar filtro de marca
                onFiltersChangeImmediate({ brandIds: undefined, brandName: undefined });
              } else {
                // Encontrar la marca seleccionada y guardar su nombre
                const brand = brands?.find(b => b.id === value);
                if (brand) {
                  onFiltersChangeImmediate({ 
                    brandIds: [value], 
                    brandName: brand.name, // Guardar nombre para URL limpia
                    recoveryStatus: undefined // Limpiar estado cuando se selecciona marca
                  });
                }
              }
              setBrandSearch('');
            }}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20">
              <SelectValue placeholder={selectedBrandName} />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 bg-white p-2 border-b border-slate-200 z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                <SelectItem value="ALL">Todas las marcas</SelectItem>
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-slate-500 text-center">
                    No se encontraron marcas
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Estado de Recuperación */}
        <div className="w-64">
          <Select
            value={filterState.recoveryStatus || 'ALL'}
            onValueChange={(value) => {
              if (value === 'ALL') {
                // Limpiar solo recoveryStatus
                onFiltersChangeImmediate({ recoveryStatus: undefined });
              } else {
                // Al seleccionar un estado, limpiar el filtro de marca
                onFiltersChangeImmediate({ 
                  recoveryStatus: value as any,
                  brandIds: undefined, // Limpiar marca cuando se selecciona estado
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

        {/* Botón Limpiar */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-3 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}


