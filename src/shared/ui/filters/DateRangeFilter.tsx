import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startLabel?: string;
  endLabel?: string;
  className?: string;
  showLabels?: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Fecha Inicio',
  endLabel = 'Fecha Fin',
  className = '',
  showLabels = true,
}: DateRangeFilterProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      <div className="flex-1">
        {showLabels && (
          <Label className="text-xs font-medium mb-1.5 block text-slate-700">
            {startLabel}
          </Label>
        )}
        <Input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20"
        />
      </div>
      <div className="flex-1">
        {showLabels && (
          <Label className="text-xs font-medium mb-1.5 block text-slate-700">
            {endLabel}
          </Label>
        )}
        <Input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20"
        />
      </div>
    </div>
  );
}
