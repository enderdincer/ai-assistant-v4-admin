/**
 * ConnectionStatus - Displays WebSocket connection status indicator.
 */

import type { ConnectionStatus as ConnectionStatusType } from '../hooks/useWebSocket';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect?: () => void;
}

const STATUS_CONFIG = {
  connecting: {
    color: 'bg-yellow-500',
    text: 'Connecting...',
    animate: true,
  },
  connected: {
    color: 'bg-green-500',
    text: 'Connected',
    animate: false,
  },
  disconnected: {
    color: 'bg-gray-500',
    text: 'Disconnected',
    animate: false,
  },
  error: {
    color: 'bg-red-500',
    text: 'Error',
    animate: false,
  },
} as const;

export function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${config.color} ${
            config.animate ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm text-gray-400">{config.text}</span>
      </div>
      {(status === 'disconnected' || status === 'error') && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
