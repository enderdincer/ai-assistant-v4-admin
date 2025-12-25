/**
 * WebSocket message types for frontend communication.
 */

import type { ServiceHealthState } from './ServiceHealth.js';

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

/** Create a typed init message */
export function createInitMessage(services: ServiceHealthState[]): InitMessage {
  return { type: 'init', data: services };
}

/** Create a typed update message */
export function createUpdateMessage(service: ServiceHealthState): UpdateMessage {
  return { type: 'update', data: service };
}

/** Create a typed heartbeat message */
export function createHeartbeatMessage(): HeartbeatMessage {
  return { type: 'heartbeat' };
}
