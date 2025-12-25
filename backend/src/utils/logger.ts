/**
 * Simple console logger with prefixes.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const color = LOG_COLORS[level];
  const prefix = `${color}[${formatTimestamp()}] [${level.toUpperCase()}] [${module}]${RESET}`;
  
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export function createLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => log('debug', module, message, data),
    info: (message: string, data?: unknown) => log('info', module, message, data),
    warn: (message: string, data?: unknown) => log('warn', module, message, data),
    error: (message: string, data?: unknown) => log('error', module, message, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
