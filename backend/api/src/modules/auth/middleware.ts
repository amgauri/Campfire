import type { RequestHandler } from 'express';
import { AppError } from '../../http/errors/app-error.js';
import type { Role } from './domain.js';
import type { AccessTokenProvider, UserRepository } from './ports.js';

export function authenticate(
  accessTokens: AccessTokenProvider,
  users: UserRepository,
): RequestHandler {
  return async (req, _res, next) => {
    const header = req.header('authorization');
    const match = header && /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(header);
    if (!match?.[1]) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }

    let identity;
    try {
      identity = await accessTokens.verify(match[1]);
    } catch {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    const user = await users.findById(identity.userId);
    if (!user || user.role !== identity.role) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    req.auth = { userId: user.id, role: user.role };
    next();
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Access denied'));
      return;
    }
    next();
  };
}
