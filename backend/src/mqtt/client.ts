/**
 * MQTT Client - Connects to broker and handles health messages.
 */

import mqtt, { MqttClient } from 'mqtt';
import { HEALTH_TOPIC_PATTERN, extractServiceFromTopic } from '../types/MqttMessage.js';
import { parseHealthMessage } from '../utils/validators.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('MQTTClient');

export interface MqttClientConfig {
  brokerUrl: string;
  clientId: string;
  reconnectPeriod: number;
  connectTimeout: number;
}

export type HealthMessageHandler = (
  service: string,
  message: ReturnType<typeof parseHealthMessage>
) => void;

export class MQTTHealthClient {
  private client: MqttClient | null = null;
  private readonly config: MqttClientConfig;
  private messageHandler: HealthMessageHandler | null = null;
  private connected = false;

  constructor(config: MqttClientConfig) {
    this.config = config;
  }

  /**
   * Set the handler for incoming health messages.
   */
  onHealthMessage(handler: HealthMessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Connect to the MQTT broker.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Connecting to MQTT broker: ${this.config.brokerUrl}`);

      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: this.config.clientId,
        reconnectPeriod: this.config.reconnectPeriod,
        connectTimeout: this.config.connectTimeout,
        clean: true,
      });

      const connectTimeout = setTimeout(() => {
        reject(new Error(`MQTT connection timeout after ${this.config.connectTimeout}ms`));
      }, this.config.connectTimeout);

      this.client.on('connect', () => {
        clearTimeout(connectTimeout);
        this.connected = true;
        logger.info('Connected to MQTT broker');
        this.subscribe();
        resolve();
      });

      this.client.on('reconnect', () => {
        logger.info('Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        this.connected = false;
        logger.warn('MQTT connection closed');
      });

      this.client.on('error', (error) => {
        logger.error('MQTT error:', error.message);
        if (!this.connected) {
          clearTimeout(connectTimeout);
          reject(error);
        }
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload.toString());
      });
    });
  }

  /**
   * Subscribe to health topics.
   */
  private subscribe(): void {
    if (!this.client) return;

    this.client.subscribe(HEALTH_TOPIC_PATTERN, (err) => {
      if (err) {
        logger.error('Failed to subscribe to health topics:', err.message);
      } else {
        logger.info(`Subscribed to: ${HEALTH_TOPIC_PATTERN}`);
      }
    });
  }

  /**
   * Handle incoming MQTT message.
   */
  private handleMessage(topic: string, payload: string): void {
    const service = extractServiceFromTopic(topic);
    if (!service) {
      logger.warn(`Could not extract service from topic: ${topic}`);
      return;
    }

    const message = parseHealthMessage(payload);
    if (!message) {
      logger.warn(`Invalid health message on ${topic}:`, payload);
      return;
    }

    if (this.messageHandler) {
      this.messageHandler(service, message);
    }
  }

  /**
   * Check if connected to broker.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from the broker.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      logger.info('Disconnecting from MQTT broker...');
      await this.client.endAsync();
      this.client = null;
      this.connected = false;
      logger.info('Disconnected from MQTT broker');
    }
  }
}
