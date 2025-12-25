/**
 * Service Health Manager - Core state management for service health.
 *
 * Responsibilities:
 * - Store current state of all services in memory
 * - Update service health from MQTT messages
 * - Detect service timeouts (no heartbeat in configured interval)
 * - Emit events when state changes
 */

import { EventEmitter } from 'events';
import type { ServiceHealthState, ServiceHealthStatus, ServiceStatus } from '../types/ServiceHealth.js';
import type { ParsedHealthMessage } from '../types/MqttMessage.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ServiceHealthManager');

export interface ServiceHealthManagerEvents {
  serviceUpdated: (service: ServiceHealthState) => void;
}

export class ServiceHealthManager extends EventEmitter {
  private services: Map<string, ServiceHealthState> = new Map();
  private timeoutInterval: NodeJS.Timeout | null = null;
  private readonly timeoutMs: number;
  private readonly checkIntervalMs: number;

  constructor(timeoutMs: number = 60000, checkIntervalMs: number = 5000) {
    super();
    this.timeoutMs = timeoutMs;
    this.checkIntervalMs = checkIntervalMs;
  }

  /**
   * Update service state from parsed MQTT health message.
   */
  updateService(message: ParsedHealthMessage): void {
    const existing = this.services.get(message.service);
    const newStatus = this.mapStatus(message.status);

    const updated: ServiceHealthState = {
      name: message.service,
      status: newStatus,
      machineId: message.machineId,
      lastSeen: message.timestamp,
      lastStatus: message.status,
    };

    this.services.set(message.service, updated);

    // Only emit if there was an actual change
    if (!existing || this.hasChanged(existing, updated)) {
      logger.info(`Service ${message.service} updated:`, {
        status: newStatus,
        machineId: message.machineId,
      });
      this.emit('serviceUpdated', updated);
    }
  }

  /**
   * Get state of a specific service.
   */
  getService(name: string): ServiceHealthState | undefined {
    return this.services.get(name);
  }

  /**
   * Get all service states.
   */
  getAllServices(): ServiceHealthState[] {
    return Array.from(this.services.values());
  }

  /**
   * Start monitoring for service timeouts.
   */
  startTimeoutMonitoring(): void {
    if (this.timeoutInterval) {
      return; // Already monitoring
    }

    logger.info(`Starting timeout monitoring (timeout: ${this.timeoutMs}ms, check interval: ${this.checkIntervalMs}ms)`);

    this.timeoutInterval = setInterval(() => {
      this.checkTimeouts();
    }, this.checkIntervalMs);
  }

  /**
   * Stop timeout monitoring.
   */
  stopTimeoutMonitoring(): void {
    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
      logger.info('Stopped timeout monitoring');
    }
  }

  /**
   * Clear all service states.
   */
  clear(): void {
    this.services.clear();
    logger.info('Cleared all service states');
  }

  /**
   * Check all services for timeouts and mark as unhealthy if needed.
   */
  private checkTimeouts(): void {
    const now = Date.now();

    for (const [name, service] of this.services.entries()) {
      if (service.status === 'healthy' && now - service.lastSeen > this.timeoutMs) {
        const updated: ServiceHealthState = {
          ...service,
          status: 'unhealthy',
        };

        this.services.set(name, updated);
        logger.warn(`Service ${name} timed out (last seen ${Math.round((now - service.lastSeen) / 1000)}s ago)`);
        this.emit('serviceUpdated', updated);
      }
    }
  }

  /**
   * Map MQTT service status to application health status.
   */
  private mapStatus(status: ServiceStatus): ServiceHealthStatus {
    switch (status) {
      case 'started':
      case 'healthy':
        return 'healthy';
      case 'stopping':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if service state has meaningfully changed.
   */
  private hasChanged(prev: ServiceHealthState, next: ServiceHealthState): boolean {
    return (
      prev.status !== next.status ||
      prev.machineId !== next.machineId ||
      prev.lastStatus !== next.lastStatus
    );
  }
}
