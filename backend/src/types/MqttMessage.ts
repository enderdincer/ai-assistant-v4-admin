/**
 * MQTT message types for health monitoring.
 */

import type { ServiceStatus } from './ServiceHealth.js';

/** Raw MQTT health message payload from services */
export interface HealthMessage {
  service: string;
  machine_id: string;
  status: ServiceStatus;
  timestamp: number; // Unix timestamp in seconds (with decimal)
}

/** Parsed health message with normalized timestamp */
export interface ParsedHealthMessage {
  service: string;
  machineId: string;
  status: ServiceStatus;
  timestamp: number; // Unix timestamp in milliseconds
}

/** MQTT topic pattern for health messages */
export const HEALTH_TOPIC_PATTERN = 'all/system/health/#';

/** Extract service name from health topic */
export function extractServiceFromTopic(topic: string): string | null {
  const match = topic.match(/^all\/system\/health\/(.+)$/);
  return match ? match[1] : null;
}
