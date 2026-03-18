/**
 * Portfolio Recovery Analysis - EmptyState Component
 * 
 * Empty state display with suggestions.
 * 
 * Requirements: 8.7, 10.2
 */

import { FileSearch, Filter } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  suggestion?: string;
}

/**
 * Empty state component
 */
export function EmptyState({ 
  message = 'No hay datos disponibles',
  suggestion = 'Intenta ajustar los filtros para ver más resultados'
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="p-4 bg-slate-100 rounded-full">
        <FileSearch className="h-10 w-10 text-slate-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-700">{message}</h3>
        <p className="text-sm text-slate-500 max-w-md flex items-center justify-center gap-2">
          <Filter className="h-4 w-4" />
          {suggestion}
        </p>
      </div>
    </div>
  );
}
