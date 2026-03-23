import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = 'Buscar...',
  label = 'Buscar',
  className = '',
  showLabel = true,
}: SearchFilterProps) {
  return (
    <div className={className}>
      {showLabel && (
        <Label className="text-xs font-medium mb-1.5 block text-slate-700">
          {label}
        </Label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 text-sm pl-9 rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20"
        />
      </div>
    </div>
  );
}
