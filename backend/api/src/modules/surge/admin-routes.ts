import { Router, type RequestHandler } from 'express';
import { requireRole } from '../auth/middleware.js';
import { surgeOverrideController } from './admin-controller.js';
import type { SurgeStatusService } from './service.js';

export function createSurgeAdminRouter(
  service: SurgeStatusService,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  router.use(authenticated, requireRole('admin'));
  router.put('/override', surgeOverrideController(service));
  return router;
}
