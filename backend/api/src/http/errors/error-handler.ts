import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { AppLogger } from '../../config/logger.js';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

function isBodyParserError(error: unknown, type: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === type
  );
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isBodyParserError(error, 'entity.parse.failed')) {
    return new AppError(400, 'BAD_REQUEST', 'Malformed JSON body');
  }
  if (isBodyParserError(error, 'entity.too.large')) {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (error instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Invalid request', {
      issues: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: issue.code,
      })),
    });
  }
  return new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
};

export function errorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error: unknown, req, res, _next) => {
    void _next;
    const appError = normalizeError(error);
    if (appError.statusCode === 500) {
      logger.error(
        {
          requestId: req.requestId,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'Unhandled request error',
      );
    }

    res.status(appError.statusCode).json({
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: req.requestId,
    });
  };
}
