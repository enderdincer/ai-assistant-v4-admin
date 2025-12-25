/**
 * WebSocket message types - mirrored from backend.
 */

import type { ServiceHealthState } from './ServiceHealth';

/** Message sent when client first connects */
export interface InitMessage {
  type: 'init';
  data: ServiceHealthState[];
}

/** Message sent when a service state updates */
export interface UpdateMessage {
  type: 'update';
  data: ServiceHealthState;
}

/** Heartbeat message to keep connection alive */
export interface HeartbeatMessage {
  type: 'heartbeat';
}

/** All possible WebSocket message types */
export type WebSocketMessage = InitMessage | UpdateMessage | HeartbeatMessage;

/** Type guard for init message */
export function isInitMessage(msg: WebSocketMessage): msg is InitMessage {
  return msg.type === 'init';
}

/** Type guard for update message */
export function isUpdateMessage(msg: WebSocketMessage): msg is UpdateMessage {
  return msg.type === 'update';
}

/** Type guard for heartbeat message */
export function isHeartbeatMessage(msg: WebSocketMessage): msg is HeartbeatMessage {
  return msg.type === 'heartbeat';
}
