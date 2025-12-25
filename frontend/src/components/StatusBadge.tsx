/**
 * StatusBadge - Displays service health status with colored indicator.
 */

import type { ServiceHealthStatus } from '../types/ServiceHealth';

interface StatusBadgeProps {
  status: ServiceHealthStatus;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  healthy: {
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
    label: 'Healthy',
  },
  unhealthy: {
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    label: 'Unhealthy',
  },
  unknown: {
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-400',
    label: 'Unknown',
  },
} as const;

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-3 w-3 rounded-full ${config.dotColor} ${
          status === 'healthy' ? 'pulse-dot' : ''
        }`}
      />
      {showLabel && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
