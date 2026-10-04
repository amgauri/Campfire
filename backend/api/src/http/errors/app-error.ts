export type ErrorCode =
  | 'BAD_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'EMAIL_IN_USE'
  | 'USERNAME_UNAVAILABLE'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}
