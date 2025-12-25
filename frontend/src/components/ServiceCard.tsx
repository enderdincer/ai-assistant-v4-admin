/**
 * ServiceCard - Displays a single service with health status and metadata.
 */

import type { ServiceHealthState } from '../types/ServiceHealth';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime, formatServiceName, truncate } from '../utils/formatters';
import { SERVICE_INFO } from '../utils/constants';

interface ServiceCardProps {
  service: ServiceHealthState;
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const { status, name, machineId, lastSeen } = service;
  const info = SERVICE_INFO[name];
  const displayName = info?.displayName || formatServiceName(name);
  const description = info?.description || '';

  // Determine card styling based on status
  const getCardClasses = () => {
    const baseClasses =
      'relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-[1.02]';

    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-500/10 border-green-500/50 glow-green`;
      case 'unhealthy':
        return `${baseClasses} bg-red-500/10 border-red-500/50 glow-red`;
      default:
        return `${baseClasses} bg-gray-700/50 border-gray-600/50 glow-gray`;
    }
  };

  return (
    <div className={getCardClasses()} onClick={onClick}>
      {/* Header with name and status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{displayName}</h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <StatusBadge status={status} showLabel={false} />
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Machine ID */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Machine:</span>
          <span className="text-gray-300 font-mono">
            {machineId ? truncate(machineId, 20) : '—'}
          </span>
        </div>

        {/* Last seen */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last seen:</span>
          <span className="text-gray-300">{formatRelativeTime(lastSeen)}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status:</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Status glow effect overlay */}
      {status === 'healthy' && (
        <div className="absolute inset-0 rounded-xl bg-green-500/5 pointer-events-none" />
      )}
      {status === 'unhealthy' && (
        <div className="absolute inset-0 rounded-xl bg-red-500/5 pointer-events-none" />
      )}
    </div>
  );
}
