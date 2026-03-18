/**
 * Portfolio Recovery Analysis - LoadingSpinner Component
 * 
 * Loading indicator for async operations.
 * 
 * Requirements: 8.6
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

/**
 * Loading spinner component
 */
export function LoadingSpinner({ message = 'Cargando datos...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-10 w-10 text-monchito-purple animate-spin" />
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}
