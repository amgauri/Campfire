import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { AppConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './http/errors/error-handler.js';
import { requestIdMiddleware } from './http/middleware/request-id.js';
import { requestLogger } from './http/middleware/request-logger.js';
import {
  createAuthModule,
  type AuthDependencies,
} from './infrastructure/auth/create-auth-router.js';
import { InMemoryPostRepository } from './infrastructure/posts/in-memory-post-repository.js';
import { InMemorySurgeStatusRepository } from './infrastructure/surge/in-memory-surge-status-repository.js';
import { healthRouter } from './modules/health/routes.js';
import { PostInteractionService } from './modules/posts/interaction-service.js';
import { createPostRouter } from './modules/posts/routes.js';
import { PostService } from './modules/posts/service.js';
import { createSurgeAdminRouter } from './modules/surge/admin-routes.js';
import type {
  SurgeOverrideRepository,
  SurgeStatusSource,
} from './modules/surge/port.js';
import { createSurgeRouter } from './modules/surge/routes.js';
import { SurgeStatusService } from './modules/surge/service.js';
import { createUserProfileRouter } from './modules/users/routes.js';
import { UserProfileService } from './modules/users/service.js';

export function createApp(
  config: AppConfig,
  authDependencies: AuthDependencies = {},
  surgeStatusSource: SurgeStatusSource = new InMemorySurgeStatusRepository(),
) {
  const app = express();
  const logger = createLogger(config);
  const auth = createAuthModule(config, authDependencies);
  const posts = new InMemoryPostRepository();
  const overrideSource: SurgeOverrideRepository | undefined =
    'setOverride' in surgeStatusSource &&
    typeof surgeStatusSource.setOverride === 'function'
      ? (surgeStatusSource as SurgeOverrideRepository)
      : undefined;
  const surge = new SurgeStatusService(surgeStatusSource, overrideSource);

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', auth.router);
  app.use(
    '/api/v1/users',
    createUserProfileRouter(
      new UserProfileService(auth.users, auth.clock),
      auth.authenticated,
    ),
  );
  app.use(
    '/api/v1/posts',
    createPostRouter(
      new PostService(posts, auth.clock),
      new PostInteractionService(posts, auth.clock),
      auth.authenticated,
    ),
  );
  app.use('/api/v1/surge', createSurgeRouter(surge));
  app.use(
    '/api/v1/admin/surge',
    createSurgeAdminRouter(surge, auth.authenticated),
  );

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}
