/**
 * Portfolio Recovery Analysis - RecoveryStatusBadge Component
 * 
 * Visual indicator for recovery status based on recovery rate.
 * Green (>50%), Yellow (30-50%), Red (<30%)
 * 
 * Requirements: 1.3
 */

import { Badge } from '@/shared/ui/badge';
import type { RecoveryStatus } from '@/features/portfolio-recovery/types';
import { getRecoveryStatusColor } from '@/features/portfolio-recovery/types';

interface RecoveryStatusBadgeProps {
  status: RecoveryStatus;
  recoveryRate: number;
  className?: string;
}

/**
 * Badge component showing recovery status with color coding
 */
export function RecoveryStatusBadge({ status, recoveryRate, className = '' }: RecoveryStatusBadgeProps) {
  const colors = getRecoveryStatusColor(status);

  const statusLabels: Record<RecoveryStatus, string> = {
    HEALTHY: 'Saludable',
    WARNING: 'Advertencia',
    CRITICAL: 'Crítico',
  };

  return (
    <Badge 
      className={`${colors.bg} ${colors.text} border ${colors.border} font-bold text-xs px-2 py-1 ${className}`}
      variant="outline"
    >
      {statusLabels[status]} ({recoveryRate.toFixed(1)}%)
    </Badge>
  );
}
