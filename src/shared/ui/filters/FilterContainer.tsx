import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface FilterContainerProps {
  children: ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterContainer({
  children,
  onClearFilters,
  hasActiveFilters = false,
  className = '',
}: FilterContainerProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        {children}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-3 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
