/**
 * useServiceHealth - Hook for managing service health state from WebSocket.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, type ConnectionStatus } from './useWebSocket';
import type { ServiceHealthState } from '../types/ServiceHealth';
import { isInitMessage, isUpdateMessage } from '../types/WebSocketMessage';

export interface UseServiceHealthReturn {
  services: ServiceHealthState[];
  getService: (name: string) => ServiceHealthState | undefined;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

export function useServiceHealth(): UseServiceHealthReturn {
  const [services, setServices] = useState<Map<string, ServiceHealthState>>(new Map());
  const { status, lastMessage, reconnect } = useWebSocket();

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (isInitMessage(lastMessage)) {
      // Initialize all services from init message
      const serviceMap = new Map<string, ServiceHealthState>();
      for (const service of lastMessage.data) {
        serviceMap.set(service.name, service);
      }
      setServices(serviceMap);
      console.log('[ServiceHealth] Initialized with', lastMessage.data.length, 'services');
    } else if (isUpdateMessage(lastMessage)) {
      // Update single service
      setServices((prev) => {
        const next = new Map(prev);
        next.set(lastMessage.data.name, lastMessage.data);
        return next;
      });
    }
    // Ignore heartbeat messages
  }, [lastMessage]);

  const getService = useCallback(
    (name: string): ServiceHealthState | undefined => {
      return services.get(name);
    },
    [services]
  );

  // Convert map to sorted array for rendering
  const serviceList = Array.from(services.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    services: serviceList,
    getService,
    connectionStatus: status,
    reconnect,
  };
}
