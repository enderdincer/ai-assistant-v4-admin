/**
 * useWebSocket - Hook for managing WebSocket connection with auto-reconnect.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage } from '../types/WebSocketMessage';
import { WS_URL, RECONNECT_DELAY, MAX_RECONNECT_DELAY } from '../utils/constants';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WebSocket] Connected to', WS_URL);
        setStatus('connected');
        reconnectDelayRef.current = RECONNECT_DELAY; // Reset delay on success
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('[WebSocket] Disconnected');
        setStatus('disconnected');
        wsRef.current = null;

        // Schedule reconnection with exponential backoff
        const delay = reconnectDelayRef.current;
        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
          connect();
        }, delay);
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        console.error('[WebSocket] Error:', event);
        setStatus('error');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setStatus('error');
    }
  }, []);

  const reconnect = useCallback(() => {
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset delay and connect
    reconnectDelayRef.current = RECONNECT_DELAY;
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { status, lastMessage, reconnect };
}
