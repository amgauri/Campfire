import { Router } from 'express';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../../http/errors/app-error.js';
import { createAuthController } from './controller.js';
import { AuthFailure } from './errors.js';
import type { AuthService } from './service.js';

function authLimit(max: number): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests'));
    },
  });
}

const authFailureHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  _res,
  next,
) => {
  if (!(error instanceof AuthFailure)) {
    next(error);
    return;
  }
  switch (error.code) {
    case 'EMAIL_IN_USE':
      next(new AppError(409, 'EMAIL_IN_USE', 'Email is already registered'));
      return;
    case 'USERNAME_UNAVAILABLE':
      next(
        new AppError(409, 'USERNAME_UNAVAILABLE', 'Username is unavailable'),
      );
      return;
    case 'INVALID_CREDENTIALS':
      next(
        new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
      );
      return;
    case 'INVALID_REFRESH_TOKEN':
      next(new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token'));
      return;
    case 'UNAUTHENTICATED':
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
  }
};

export function createAuthRouter(
  service: AuthService,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  const controller = createAuthController(service);

  // /register and /me are compatibility aliases for the original API.
  router.post(['/signup', '/register'], authLimit(10), controller.register);
  router.post('/login', authLimit(20), controller.login);
  router.post('/refresh', authLimit(30), controller.refresh);
  router.post('/logout', authLimit(30), controller.logout);
  router.post('/onboarding', authenticated, controller.onboarding);
  router.get(['/session', '/me'], authenticated, controller.me);
  router.use(authFailureHandler);

  return router;
}
