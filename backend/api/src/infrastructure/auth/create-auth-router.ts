import type { Router } from 'express';
import type { AppConfig } from '../../config/env.js';
import { authenticate } from '../../modules/auth/middleware.js';
import type {
  Clock,
  RefreshSessionRepository,
  UserRepository,
} from '../../modules/auth/ports.js';
import { createAuthRouter as authRoutes } from '../../modules/auth/routes.js';
import { AuthService } from '../../modules/auth/service.js';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';
import { InMemoryRefreshSessionRepository } from './in-memory-refresh-session-repository.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';
import { JwtAccessTokenProvider } from './jwt-access-token-provider.js';

export type AuthDependencies = {
  users?: UserRepository;
  refreshSessions?: RefreshSessionRepository;
  clock?: Clock;
};

export function createAuthModule(
  config: AppConfig,
  dependencies: AuthDependencies = {},
): Router {
  const users = dependencies.users ?? new InMemoryUserRepository();
  const refreshSessions =
    dependencies.refreshSessions ?? new InMemoryRefreshSessionRepository();
  const clock = dependencies.clock ?? { now: () => new Date() };
  const tokens = new JwtAccessTokenProvider(
    config.authAccessTokenSecret,
    config.authAccessTokenTtlSeconds,
    clock,
  );
  const service = new AuthService(
    users,
    refreshSessions,
    new Argon2PasswordHasher(),
    tokens,
    clock,
    config.authAccessTokenTtlSeconds,
    config.authRefreshTokenTtlDays,
  );
  return authRoutes(service, authenticate(tokens, users));
}
