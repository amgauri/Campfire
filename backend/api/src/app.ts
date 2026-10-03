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
import { InactiveSurgeStatusSource } from './infrastructure/surge/inactive-surge-status-source.js';
import { healthRouter } from './modules/health/routes.js';
import type { SurgeStatusSource } from './modules/surge/port.js';
import { createSurgeRouter } from './modules/surge/routes.js';
import { SurgeStatusService } from './modules/surge/service.js';

export function createApp(
  config: AppConfig,
  authDependencies: AuthDependencies = {},
  surgeStatusSource: SurgeStatusSource = new InactiveSurgeStatusSource(),
) {
  const app = express();
  const logger = createLogger(config);

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', createAuthModule(config, authDependencies));
  app.use(
    '/api/v1/surge',
    createSurgeRouter(new SurgeStatusService(surgeStatusSource)),
  );

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}
