import type { RequestHandler } from 'express';
import { AppError } from '../../http/errors/app-error.js';
import { success } from '../../http/response/success.js';
import type { PostService } from './service.js';
import {
  createPostSchema,
  listPostsQuerySchema,
  postIdSchema,
} from './validation.js';

export function createPostController(service: PostService): {
  create: RequestHandler;
  get: RequestHandler;
  list: RequestHandler;
  delete: RequestHandler;
} {
  return {
    create: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const post = await service.create(
        req.auth.userId,
        createPostSchema.parse(req.body),
      );
      res.status(201).json(success(post));
    },
    get: async (req, res) => {
      const post = await service.get(postIdSchema.parse(req.params.postId));
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
      res.status(200).json(success(post));
    },
    list: async (req, res) => {
      const query = listPostsQuerySchema.parse(req.query);
      res.status(200).json(success(await service.list(query)));
    },
    delete: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const result = await service.deleteOwned(
        postIdSchema.parse(req.params.postId),
        req.auth.userId,
      );
      if (result === 'not_found')
        throw new AppError(404, 'NOT_FOUND', 'Post not found');
      if (result === 'forbidden')
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      res.status(204).send();
    },
  };
}
