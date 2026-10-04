import { performance } from 'node:perf_hooks';
import type { RequestHandler } from 'express';
import type { AppLogger } from '../../config/logger.js';

export function requestLogger(logger: AppLogger): RequestHandler {
  return (req, res, next) => {
    const startedAt = performance.now();

    res.once('finish', () => {
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'HTTP request completed',
      );
    });

    next();
  };
}
