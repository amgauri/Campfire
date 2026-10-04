import { Router, type RequestHandler } from 'express';
import { createPostController } from './controller.js';
import { createInteractionController } from './interaction-controller.js';
import type { PostInteractionService } from './interaction-service.js';
import type { PostService } from './service.js';

export function createPostRouter(
  service: PostService,
  interactions: PostInteractionService,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  const controller = createPostController(service);
  const interactionController = createInteractionController(interactions);

  router.use(authenticated);
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:postId', controller.get);
  router.delete('/:postId', controller.delete);
  router.get('/:postId/likes/me', interactionController.getLikeState);
  router.post('/:postId/likes', interactionController.like);
  router.delete('/:postId/likes', interactionController.unlike);
  router.post('/:postId/comments', interactionController.createComment);
  router.get('/:postId/comments', interactionController.listComments);
  router.delete(
    '/:postId/comments/:commentId',
    interactionController.deleteComment,
  );

  return router;
}
