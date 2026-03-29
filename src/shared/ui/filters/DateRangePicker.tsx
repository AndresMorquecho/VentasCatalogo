import { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import './compact-calendar.css';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

interface DateRangePickerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  label = 'Rango de Fechas',
  placeholder = 'Seleccionar rango',
  className: containerClassName = '',
  showLabel = true,
  ...props
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const disabled = props.disabled;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range);
    // NO cerrar automáticamente - dejar que el usuario seleccione ambas fechas
    // Solo cerrar si hace click fuera o en el botón cerrar
  };

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) return placeholder;
    
    if (!range.to) {
      return format(range.from, 'dd MMM yyyy', { locale: es });
    }
    
    return `${format(range.from, 'dd MMM', { locale: es })} - ${format(range.to, 'dd MMM yyyy', { locale: es })}`;
  };

  return (
    <div className={`relative ${containerClassName}`}>
      {showLabel && (
        <Label className="text-xs font-medium mb-1.5 block text-slate-700">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <button
          type="button"
          {...props}
          onClick={(e) => {
            if (!disabled) setIsOpen(!isOpen);
            if (props.onClick) props.onClick(e);
          }}
          className={`
            w-full h-9 px-3 pr-20 text-xs text-left
            bg-white border border-slate-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-monchito-purple/20
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 cursor-pointer'}
            ${value?.from ? 'text-slate-900 font-medium' : 'text-slate-500'}
          `}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="truncate">{formatDateRange(value)}</span>
          </div>
        </button>

        {value?.from && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Calendar Dropdown */}
          <div className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 w-[220px]">
            <div className="flex justify-center">
              <DayPicker
                mode="range"
                selected={value}
                onSelect={handleSelect}
                locale={es}
                numberOfMonths={1}
                className="compact-calendar"
                modifiers={{
                  range_start: value?.from ? [value.from] : [],
                  range_end: value?.to ? [value.to] : [],
                }}
                modifiersClassNames={{
                  range_start: 'rdp-day_range_start',
                  range_end: 'rdp-day_range_end',
                  range_middle: 'rdp-day_range_middle',
                }}
                classNames={{
                  months: 'flex flex-col',
                  month: 'space-y-0',
                  caption: 'flex justify-center pt-0 relative items-center mb-1',
                  caption_label: 'text-xs font-bold text-slate-900',
                  nav: 'space-x-1 flex items-center',
                  nav_button: 'h-6 w-6 bg-transparent p-0 hover:bg-slate-100 inline-flex items-center justify-center rounded-md hover:bg-monchito-purple/10 transition-colors border border-slate-200',
                  nav_button_previous: 'absolute left-0',
                  nav_button_next: 'absolute right-0',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-slate-600 w-7 h-7 font-semibold text-xs flex items-center justify-center',
                  row: 'flex w-full',
                  cell: 'text-center p-0 relative w-7 h-7',
                  day: 'h-7 w-7 p-0 font-normal hover:bg-monchito-purple/10 rounded-full transition-colors text-xs inline-flex items-center justify-center',
                  day_selected: 'bg-monchito-purple text-white hover:bg-monchito-purple font-normal rounded-full',
                  day_today: 'bg-slate-100 font-bold ring-1 ring-monchito-purple/30',
                  day_outside: 'text-slate-300 opacity-40',
                  day_disabled: 'text-slate-300 opacity-30 cursor-not-allowed',
                  day_range_middle: 'bg-monchito-purple/15 text-slate-900 rounded-none font-normal',
                  day_range_start: 'bg-monchito-purple text-white font-normal',
                  day_range_end: 'bg-monchito-purple text-white font-normal',
                  day_hidden: 'invisible',
                }}
              />
            </div>
            
            <div className="pt-2 mt-2 border-t border-slate-100">
              {value?.from && (
                <div className="text-[10px] text-center mb-2">
                  <span className="text-slate-500">Seleccionado: </span>
                  <span className="font-semibold text-slate-900">{formatDateRange(value)}</span>
                </div>
              )}
              <div className="flex gap-1.5 justify-center">
                {value?.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-6 px-2 text-[10px] hover:bg-red-50 hover:text-red-600"
                  >
                    Limpiar
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 px-2.5 text-[10px] bg-monchito-purple hover:bg-monchito-purple/90"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
