/**
 * Filtros Globales con DateRangePicker
 * Marca, estado de recuperación y rango de fechas.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarRange, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useBrandsList } from '../hooks/useBrandsList';
import { BrandFilter, FilterContainer } from '@/shared/ui/filters';
import { Label } from '@/shared/ui/label';
import type { FilterState } from '@/features/portfolio-recovery/types';

interface GlobalFiltersProps {
  filterState: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onFiltersChangeImmediate: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const getRecoveryStatusLabel = (status?: string) => {
  switch (status) {
    case 'HEALTHY': return '● Saludable (>50%)';
    case 'WARNING': return '● Advertencia (30-50%)';
    case 'CRITICAL': return '● Crítico (<30%)';
    default: return 'Todos los estados';
  }
};

export function GlobalFilters({
  filterState,
  onFiltersChangeImmediate,
  onClearFilters,
}: GlobalFiltersProps) {
  const { data: brands } = useBrandsList();
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Derive the date range from filterState strings
  const dateRange = useMemo(() => ({
    from: filterState.dateFrom ? new Date(filterState.dateFrom + 'T00:00:00') : undefined,
    to:   filterState.dateTo   ? new Date(filterState.dateTo   + 'T00:00:00') : undefined,
  }), [filterState.dateFrom, filterState.dateTo]);

  // Label for the button
  const dateLabel = useMemo(() => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'dd/MM/yy')} – ${format(dateRange.to, 'dd/MM/yy')}`;
    }
    if (dateRange.from) {
      return `Desde ${format(dateRange.from, 'dd/MM/yy')}`;
    }
    return 'Rango de Fechas';
  }, [dateRange]);

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

  // Determine active filters
  const hasDateFilter = !!(filterState.dateFrom || filterState.dateTo);
  const hasActiveFilters =
    (filterState.recoveryStatus && filterState.recoveryStatus !== 'ALL') ||
    filterState.brandName !== undefined ||
    hasDateFilter;

  const selectedBrandId = useMemo(() => {
    if (!filterState.brandName || !brands) return undefined;
    return brands.find(b => b.name === filterState.brandName)?.id;
  }, [filterState.brandName, brands]);

  return (
    <FilterContainer onClearFilters={onClearFilters} hasActiveFilters={hasActiveFilters}>
      {/* Selector de Marca */}
      <div className="flex-1 min-w-[240px]">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Marca</Label>
        <BrandFilter
          brands={brands || []}
          value={selectedBrandId}
          showLabel={false}
          onChange={(brandId) => {
            if (!brandId) {
              onFiltersChangeImmediate({ brandIds: undefined, brandName: undefined });
            } else {
              const brand = brands?.find(b => b.id === brandId);
              if (brand) {
                onFiltersChangeImmediate({
                  brandIds: [brandId],
                  brandName: brand.name,
                  recoveryStatus: undefined,
                });
              }
            }
          }}
          className="w-full"
        />
      </div>

      {/* Estado de Recuperación */}
      <div className="w-full sm:w-56">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Estado</Label>
        <Select
          value={filterState.recoveryStatus || 'ALL'}
          onValueChange={(value) => {
            if (value === 'ALL') {
              onFiltersChangeImmediate({ recoveryStatus: undefined });
            } else {
              onFiltersChangeImmediate({
                recoveryStatus: value as any,
                brandIds: undefined,
                brandName: undefined,
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

      {/* Date Range Picker */}
      <div className="relative z-50 w-full sm:w-72" ref={calendarRef}>
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Período</Label>
        <button
          onClick={() => setShowCalendar(prev => !prev)}
          className={[
            'h-9 w-full px-4 rounded-lg border text-xs font-semibold flex items-center justify-between gap-2 transition-all',
            hasDateFilter
              ? 'border-monchito-purple/40 bg-monchito-purple/5 text-monchito-purple'
              : 'border-slate-200 bg-white text-slate-500 hover:border-monchito-purple/30',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarRange className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </div>
          {hasDateFilter && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onFiltersChangeImmediate({ dateFrom: undefined, dateTo: undefined });
              }}
              className="ml-1 hover:text-rose-500 transition-colors shrink-0"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>

        {showCalendar && (
          <div
            className="absolute top-11 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden"
            style={{ minWidth: '340px' }}
          >
            <style>{`
              .rdp-portfolio {
                --rdp-accent-color: #7c3aed;
                --rdp-accent-background-color: #ede9fe;
                --rdp-day-height: 36px;
                --rdp-day-width: 36px;
                --rdp-day_button-border-radius: 8px;
                --rdp-day_button-height: 34px;
                --rdp-day_button-width: 34px;
                --rdp-range_middle-background-color: #ede9fe;
                --rdp-range_start-color: white;
                --rdp-range_end-color: white;
                --rdp-range_start-date-background-color: #7c3aed;
                --rdp-range_end-date-background-color: #7c3aed;
                --rdp-today-color: #7c3aed;
                font-family: inherit;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              .rdp-portfolio .rdp-months { display: flex; gap: 32px; flex-wrap: wrap; }
              .rdp-portfolio .rdp-month { display: flex; flex-direction: column; gap: 12px; }
              .rdp-portfolio .rdp-month_caption { display: flex; justify-content: center; align-items: center; height: 32px; margin-bottom: 8px; position: relative; }
              .rdp-portfolio .rdp-caption_label { font-size: 14px; font-weight: 800; color: #1e1b4b; text-transform: capitalize; }
              .rdp-portfolio .rdp-nav { position: absolute; right: 0; display: flex; gap: 4px; }
              .rdp-portfolio .rdp-nav button { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #64748b; transition: all 0.15s; }
              .rdp-portfolio .rdp-nav button:hover { background: #f5f3ff; border-color: #a78bfa; color: #7c3aed; }
              .rdp-portfolio .rdp-head_row { display: flex; margin-bottom: 8px; }
              .rdp-portfolio .rdp-head_cell { flex: 1; text-align: center; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
              .rdp-portfolio .rdp-tbody { display: flex; flex-direction: column; gap: 2px; }
              .rdp-portfolio .rdp-row { display: flex; gap: 2px; }
              .rdp-portfolio .rdp-cell { flex: 1; display: flex; justify-content: center; }
              .rdp-portfolio .rdp-day_button {
                width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                border: none; background: transparent; cursor: pointer; border-radius: 8px;
                font-size: 12px; font-weight: 600; color: #334155; transition: all 0.15s;
              }
              .rdp-portfolio .rdp-day_button:hover:not([disabled]) { background: #f5f3ff; color: #7c3aed; }
              .rdp-portfolio .rdp-selected .rdp-day_button { background: #7c3aed; color: white; }
              .rdp-portfolio .rdp-range_middle .rdp-day_button { background: #ede9fe; color: #6d28d9; border-radius: 0; width: 100%; }
              .rdp-portfolio .rdp-range_start .rdp-day_button { border-radius: 8px 0 0 8px; }
              .rdp-portfolio .rdp-range_end .rdp-day_button { border-radius: 0 8px 8px 0; }
              .rdp-portfolio .rdp-today .rdp-day_button { color: #7c3aed; font-weight: 800; text-decoration: underline; }
              .rdp-portfolio .rdp-outside .rdp-day_button { color: #cbd5e1; opacity: 0.5; }
            `}</style>
            <DayPicker
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                onFiltersChangeImmediate({
                  dateFrom: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                  dateTo:   range?.to   ? format(range.to,   'yyyy-MM-dd') : undefined,
                });
                if (range?.from && range?.to) setShowCalendar(false);
              }}
              locale={es}
              numberOfMonths={1}
              className="rdp-portfolio"
            />
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  onFiltersChangeImmediate({ dateFrom: undefined, dateTo: undefined });
                  setShowCalendar(false);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 transition-all shadow-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </FilterContainer>
  );
}
