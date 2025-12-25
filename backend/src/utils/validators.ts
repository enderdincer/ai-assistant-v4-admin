/**
 * Runtime type validators (type guards).
 */

import type { HealthMessage, ParsedHealthMessage } from '../types/MqttMessage.js';
import type { ServiceStatus } from '../types/ServiceHealth.js';

const VALID_STATUSES: ServiceStatus[] = ['started', 'healthy', 'stopping'];

/**
 * Type guard to validate MQTT health message structure.
 */
export function isHealthMessage(value: unknown): value is HealthMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.service === 'string' &&
    obj.service.length > 0 &&
    typeof obj.machine_id === 'string' &&
    typeof obj.status === 'string' &&
    VALID_STATUSES.includes(obj.status as ServiceStatus) &&
    typeof obj.timestamp === 'number' &&
    !isNaN(obj.timestamp)
  );
}

/**
 * Parse and validate raw MQTT message payload.
 * Returns null if invalid.
 */
export function parseHealthMessage(payload: string): ParsedHealthMessage | null {
  try {
    const parsed: unknown = JSON.parse(payload);

    if (!isHealthMessage(parsed)) {
      return null;
    }

    // Convert timestamp from seconds to milliseconds
    return {
      service: parsed.service,
      machineId: parsed.machine_id,
      status: parsed.status,
      timestamp: Math.floor(parsed.timestamp * 1000),
    };
  } catch {
    return null;
  }
}
