/**
 * Portfolio Recovery Analysis - GlobalFilters Component
 * 
 * Global filters for portfolio recovery with URL sync and debouncing.
 * Includes date range, brand, client, status, days, and amount filters.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8
 */

import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { X, Filter } from 'lucide-react';
import type { FilterState } from '@/features/portfolio-recovery/types';

interface GlobalFiltersProps {
  filterState: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onFiltersChangeImmediate: (updates: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

/**
 * Global filters component with debouncing for text inputs
 */
export function GlobalFilters({ 
  filterState, 
  onFiltersChange, 
  onFiltersChangeImmediate,
  onClearFilters 
}: GlobalFiltersProps) {
  const hasActiveFilters = Object.keys(filterState).length > 0;

  return (
    <Card className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-monchito-purple" />
          <h3 className="text-sm font-bold text-slate-900">Filtros Globales</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Date From */}
        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="text-xs font-semibold text-slate-700">
            Fecha Desde
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={filterState.dateFrom || ''}
            onChange={(e) => onFiltersChangeImmediate({ dateFrom: e.target.value || undefined })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label htmlFor="dateTo" className="text-xs font-semibold text-slate-700">
            Fecha Hasta
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={filterState.dateTo || ''}
            onChange={(e) => onFiltersChangeImmediate({ dateTo: e.target.value || undefined })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        {/* Recovery Status */}
        <div className="space-y-2">
          <Label htmlFor="recoveryStatus" className="text-xs font-semibold text-slate-700">
            Estado de Recuperación
          </Label>
          <Select
            value={filterState.recoveryStatus || 'ALL'}
            onValueChange={(value) => onFiltersChangeImmediate({ 
              recoveryStatus: value === 'ALL' ? undefined : value as any 
            })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="HEALTHY">Saludable (&gt;50%)</SelectItem>
              <SelectItem value="WARNING">Advertencia (30-50%)</SelectItem>
              <SelectItem value="CRITICAL">Crítico (&lt;30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Days in Warehouse */}
        <div className="space-y-2">
          <Label htmlFor="minDaysInWarehouse" className="text-xs font-semibold text-slate-700">
            Días Mínimos en Bodega
          </Label>
          <Input
            id="minDaysInWarehouse"
            type="number"
            min="0"
            placeholder="Ej: 30"
            value={filterState.minDaysInWarehouse || ''}
            onChange={(e) => onFiltersChange({ 
              minDaysInWarehouse: e.target.value || undefined 
            })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        {/* Min Amount */}
        <div className="space-y-2">
          <Label htmlFor="minAmount" className="text-xs font-semibold text-slate-700">
            Monto Mínimo
          </Label>
          <Input
            id="minAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej: 1000"
            value={filterState.minAmount || ''}
            onChange={(e) => onFiltersChange({ 
              minAmount: e.target.value || undefined 
            })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        {/* Brand IDs - Simplified for MVP */}
        <div className="space-y-2">
          <Label htmlFor="brandIds" className="text-xs font-semibold text-slate-700">
            IDs de Marcas (separados por coma)
          </Label>
          <Input
            id="brandIds"
            type="text"
            placeholder="Ej: id1,id2,id3"
            value={filterState.brandIds?.join(',') || ''}
            onChange={(e) => onFiltersChange({ 
              brandIds: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
            })}
            className="h-11 rounded-xl text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 italic">
        * Los filtros de texto se aplican automáticamente después de 300ms de inactividad
      </p>
    </Card>
  );
}
