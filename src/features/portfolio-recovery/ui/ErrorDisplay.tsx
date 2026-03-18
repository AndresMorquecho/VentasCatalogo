/**
 * Portfolio Recovery Analysis - ErrorDisplay Component
 * 
 * Error display with retry option.
 * 
 * Requirements: 10.1
 */

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

interface ErrorDisplayProps {
  error: Error | unknown;
  onRetry?: () => void;
}

/**
 * Error display component with retry button
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al cargar los datos';

  return (
    <div className="p-8">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-bold text-lg">Error al cargar datos</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{errorMessage}</p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50"
            >
              Reintentar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
