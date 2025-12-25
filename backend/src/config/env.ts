/**
 * Environment configuration with validation.
 */

import 'dotenv/config';

export interface Config {
  port: number;
  wsPort: number;
  nodeEnv: string;
  mqttBrokerUrl: string;
  mqttClientId: string;
  mqttReconnectPeriod: number;
  mqttConnectTimeout: number;
  serviceTimeoutMs: number;
  healthCheckIntervalMs: number;
  wsHeartbeatInterval: number;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`[Config] Invalid number for ${key}: ${value}, using default ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function loadConfig(): Config {
  const config: Config = {
    port: getEnvNumber('PORT', 3001),
    wsPort: getEnvNumber('WS_PORT', 3002),
    nodeEnv: getEnvString('NODE_ENV', 'development'),
    mqttBrokerUrl: getEnvString('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
    mqttClientId: getEnvString('MQTT_CLIENT_ID', `admin-dashboard-${Date.now()}`),
    mqttReconnectPeriod: getEnvNumber('MQTT_RECONNECT_PERIOD', 1000),
    mqttConnectTimeout: getEnvNumber('MQTT_CONNECT_TIMEOUT', 30000),
    serviceTimeoutMs: getEnvNumber('SERVICE_TIMEOUT_MS', 60000),
    healthCheckIntervalMs: getEnvNumber('HEALTH_CHECK_INTERVAL_MS', 5000),
    wsHeartbeatInterval: getEnvNumber('WS_HEARTBEAT_INTERVAL', 30000),
  };

  return config;
}

/** Singleton config instance */
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
