import pino from 'pino';
import type { AppConfig } from './env.js';

export function createLogger(config: AppConfig) {
  return pino({
    level: config.logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
      ],
      censor: '[Redacted]',
    },
  });
}

export type AppLogger = ReturnType<typeof createLogger>;
