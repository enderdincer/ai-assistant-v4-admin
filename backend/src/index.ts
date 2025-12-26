/**
 * AI Assistant v4 Admin Dashboard - Backend Server
 *
 * Main entry point that orchestrates:
 * - Express HTTP server with health endpoints
 * - MQTT client for service health subscription
 * - WebSocket server for real-time frontend updates
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { getConfig } from './config/env.js';
import { MQTTHealthClient } from './mqtt/client.js';
import { ServiceHealthManager } from './services/ServiceHealthManager.js';
import { createInitMessage, createUpdateMessage, createHeartbeatMessage } from './types/WebSocketMessage.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('Server');

// Load configuration
const config = getConfig();

// Initialize Express app
const app = express();
app.use(express.json());

// Create HTTP server for both Express and WebSocket
const httpServer = createServer(app);

// Initialize core services
const healthManager = new ServiceHealthManager(config.serviceTimeoutMs, config.healthCheckIntervalMs);

// Initialize MQTT client
const mqttClient = new MQTTHealthClient({
  brokerUrl: config.mqttBrokerUrl,
  clientId: config.mqttClientId,
  reconnectPeriod: config.mqttReconnectPeriod,
  connectTimeout: config.mqttConnectTimeout,
});

// Initialize WebSocket server on separate port
const wss = new WebSocketServer({ port: config.wsPort });
const wsClients = new Set<WebSocket>();

// ============================================================================
// HTTP Routes
// ============================================================================

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient.isConnected(),
    wsClients: wsClients.size,
    services: healthManager.getAllServices().length,
    timestamp: new Date().toISOString(),
  });
});

// Get all services
app.get('/api/services', (_req, res) => {
  res.json(healthManager.getAllServices());
});

// Get specific service
app.get('/api/services/:name', (req, res) => {
  const service = healthManager.getService(req.params.name);
  if (service) {
    res.json(service);
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// ============================================================================
// WebSocket Handling
// ============================================================================

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  wsClients.add(ws);

  // Send initial state to new client
  const initMessage = createInitMessage(healthManager.getAllServices());
  ws.send(JSON.stringify(initMessage));

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    logger.error('WebSocket client error:', error.message);
    wsClients.delete(ws);
  });
});

// Broadcast message to all connected clients
function broadcast(message: object): void {
  const data = JSON.stringify(message);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Forward service updates to WebSocket clients
healthManager.on('serviceUpdated', (service) => {
  const updateMessage = createUpdateMessage(service);
  broadcast(updateMessage);
});

// WebSocket heartbeat
setInterval(() => {
  const heartbeat = createHeartbeatMessage();
  broadcast(heartbeat);
}, config.wsHeartbeatInterval);

// ============================================================================
// MQTT Handling
// ============================================================================

mqttClient.onHealthMessage((_service, message) => {
  if (message) {
    healthManager.updateService(message);
  }
});

// ============================================================================
// Startup & Shutdown
// ============================================================================

async function start(): Promise<void> {
  logger.info('Starting AI Assistant v4 Admin Dashboard Backend...');
  logger.info(`Configuration:`, {
    port: config.port,
    wsPort: config.wsPort,
    mqttBrokerUrl: config.mqttBrokerUrl,
    serviceTimeoutMs: config.serviceTimeoutMs,
  });

  // Start HTTP server
  httpServer.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
  });

  // Connect to MQTT broker
  try {
    await mqttClient.connect();
  } catch (error) {
    logger.error('Failed to connect to MQTT broker. Server will continue without MQTT.');
    logger.error('Error:', error instanceof Error ? error.message : String(error));
  }

  // Start timeout monitoring
  healthManager.startTimeoutMonitoring();

  logger.info(`WebSocket server listening on port ${config.wsPort}`);
  logger.info('Backend started successfully!');
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down...');

  // Stop timeout monitoring
  healthManager.stopTimeoutMonitoring();

  // Close WebSocket connections
  for (const client of wsClients) {
    client.close();
  }
  wss.close();

  // Disconnect from MQTT
  await mqttClient.disconnect();

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
