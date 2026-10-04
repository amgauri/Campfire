import { Router, type RequestHandler } from 'express';
import { createUserProfileController } from './controller.js';
import type { UserProfileService } from './service.js';

export function createUserProfileRouter(
  service: UserProfileService,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  const controller = createUserProfileController(service);

  router.get('/me', authenticated, controller.getOwn);
  router.patch('/me', authenticated, controller.updateOwn);
  router.get('/:userId', controller.getPublic);

  return router;
}
