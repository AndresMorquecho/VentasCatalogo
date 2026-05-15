/**
 * Filtros Globales con DateRangePicker
 * Marca (multi-select), estado de recuperación y rango de fechas.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarRange, X, ChevronDown, Check, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useBrandsList } from '../hooks/useBrandsList';
import { FilterContainer } from '@/shared/ui/filters';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
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
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [brandSearch, setBrandSearch] = useState('');

  // Current selected brand IDs from filterState
  const selectedBrandIds: string[] = useMemo(() => {
    return filterState.brandIds || [];
  }, [filterState.brandIds]);

  // Brand names for display
  const selectedBrandNames = useMemo(() => {
    if (!brands) return [];
    return brands.filter(b => selectedBrandIds.includes(b.id)).map(b => b.name);
  }, [brands, selectedBrandIds]);

  // Filtered brands for search
  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    if (!brandSearch) return brands;
    const search = brandSearch.toLowerCase();
    return brands.filter(b => b.name.toLowerCase().includes(search));
  }, [brands, brandSearch]);

  // Label for button
  const brandLabel = selectedBrandIds.length === 0
    ? 'Todas las marcas'
    : selectedBrandIds.length === 1
      ? selectedBrandNames[0] || 'Marca'
      : `${selectedBrandIds.length} marcas`;

  const toggleBrand = (id: string) => {
    let newIds: string[];
    if (selectedBrandIds.includes(id)) {
      newIds = selectedBrandIds.filter(b => b !== id);
    } else {
      newIds = [...selectedBrandIds, id];
    }
    onFiltersChangeImmediate({
      brandIds: newIds.length > 0 ? newIds : undefined,
      brandName: newIds.length === 1
        ? brands?.find(b => b.id === newIds[0])?.name
        : undefined,
    });
  };

  const selectAllBrands = () => {
    if (!brands) return;
    const allIds = brands.map(b => b.id);
    onFiltersChangeImmediate({
      brandIds: allIds,
      brandName: undefined,
    });
  };

  const clearBrands = () => {
    onFiltersChangeImmediate({
      brandIds: undefined,
      brandName: undefined,
    });
  };

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

  // Close brand dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setShowBrandDropdown(false);
        setBrandSearch('');
      }
    }
    if (showBrandDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showBrandDropdown]);

  // Determine active filters
  const hasDateFilter = !!(filterState.dateFrom || filterState.dateTo);
  const hasActiveFilters =
    (filterState.recoveryStatus && filterState.recoveryStatus !== 'ALL') ||
    selectedBrandIds.length > 0 ||
    hasDateFilter;

  return (
    <FilterContainer onClearFilters={onClearFilters} hasActiveFilters={hasActiveFilters}>
      {/* Selector de Marca — Multi-select con checkboxes */}
      <div className="flex-1 min-w-[240px]" ref={brandDropdownRef}>
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Marca</Label>
        <div className="relative">
          <button
            onClick={() => { setShowBrandDropdown(prev => !prev); setBrandSearch(''); }}
            className={cn(
              "h-9 w-full px-3 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-all",
              selectedBrandIds.length > 0
                ? "border-monchito-purple/40 bg-monchito-purple/5 text-monchito-purple"
                : "border-slate-200 bg-white text-slate-700 hover:border-monchito-purple/30"
            )}
          >
            <span className="truncate flex-1 text-left">{brandLabel}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform flex-shrink-0", showBrandDropdown && "rotate-180")} />
          </button>

          {/* Selected brand chips */}
          {selectedBrandIds.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {selectedBrandNames.slice(0, 4).map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-monchito-purple/10 text-monchito-purple text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {name.length > 14 ? name.substring(0, 14) + '…' : name}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBrand(selectedBrandIds[i]); }}
                    className="hover:text-red-500 ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {selectedBrandNames.length > 4 && (
                <span className="text-[9px] font-bold text-monchito-purple/60 self-center">+{selectedBrandNames.length - 4} más</span>
              )}
            </div>
          )}

          {showBrandDropdown && (
            <div className="absolute top-11 left-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200/60 w-full min-w-[240px] max-h-[360px] overflow-hidden flex flex-col">
              {/* Search */}
              <div className="sticky top-0 bg-white p-2 border-b border-slate-100 z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              {/* Header actions */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {selectedBrandIds.length}/{brands?.length || 0} seleccionadas
                </span>
                <div className="flex gap-2">
                  <button onClick={selectAllBrands} className="text-[10px] font-bold text-monchito-purple hover:underline">
                    Todas
                  </button>
                  <span className="text-slate-200">|</span>
                  <button onClick={clearBrands} className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline">
                    Ninguna
                  </button>
                </div>
              </div>
              {/* Brand list */}
              <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                {filteredBrands.length > 0 ? filteredBrands.map((b) => {
                  const isSelected = selectedBrandIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBrand(b.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold transition-all hover:bg-slate-50",
                        isSelected ? "text-monchito-purple bg-monchito-purple/5" : "text-slate-600"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border transition-all",
                        isSelected
                          ? "bg-monchito-purple border-monchito-purple"
                          : "border-slate-300 bg-white"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="truncate">{b.name}</span>
                    </button>
                  );
                }) : (
                  <div className="p-4 text-sm text-slate-400 text-center">No se encontraron marcas</div>
                )}
              </div>
            </div>
          )}
        </div>
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
