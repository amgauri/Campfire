import { Router } from 'express';
import { surgeStatusController } from './controller.js';
import type { SurgeStatusService } from './service.js';

export function createSurgeRouter(service: SurgeStatusService): Router {
  const router = Router();
  router.get('/status', surgeStatusController(service));
  return router;
}
