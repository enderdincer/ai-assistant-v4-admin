/**
 * Service health types - mirrored from backend.
 */

/** Status reported by services via MQTT */
export type ServiceStatus = 'started' | 'healthy' | 'stopping';

/** Computed health status for display */
export type ServiceHealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/** Service state received from backend */
export interface ServiceHealthState {
  name: string;
  status: ServiceHealthStatus;
  machineId: string | null;
  lastSeen: number; // Unix timestamp in milliseconds
  lastStatus: ServiceStatus | null;
}

/** Known service names from ai-assistant-v4 */
export const SERVICE_NAMES = [
  'audio_collector',
  'transcription',
  'speech',
  'assistant',
  'text_interaction',
  'memory',
  'extraction',
] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];
