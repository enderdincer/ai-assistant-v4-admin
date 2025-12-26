/**
 * Application constants and configuration.
 */

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

/** Service display information */
export const SERVICE_INFO: Record<string, { displayName: string; description: string }> = {
  audio_collector: {
    displayName: 'Audio Collector',
    description: 'Captures audio from microphone',
  },
  transcription: {
    displayName: 'Transcription',
    description: 'Speech-to-text (STT)',
  },
  speech: {
    displayName: 'Speech',
    description: 'Text-to-speech (TTS)',
  },
  assistant: {
    displayName: 'Assistant',
    description: 'LLM conversational AI',
  },
  text_interaction: {
    displayName: 'Text Interaction',
    description: 'CLI text interface',
  },
  memory: {
    displayName: 'Memory',
    description: 'Conversation/fact storage',
  },
  extraction: {
    displayName: 'Extraction',
    description: 'Fact extraction from conversations',
  },
};

/** WebSocket configuration */
function getWebSocketUrl(): string {
  // In production (non-localhost), always connect through nginx proxy
  // This takes precedence to ensure deployed apps work correctly
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/ws`;
  }

  // For local development, use env var or default
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
}

export const WS_URL = getWebSocketUrl();
export const RECONNECT_DELAY = parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY || '1000', 10);
export const MAX_RECONNECT_DELAY = parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_DELAY || '30000', 10);
