import type { RequestHandler } from 'express';
import { AppError } from '../../http/errors/app-error.js';
import { success } from '../../http/response/success.js';
import type { PostInteractionService } from './interaction-service.js';
import {
  commentIdSchema,
  createCommentSchema,
  emptyBodySchema,
  listCommentsQuerySchema,
} from './interaction-validation.js';
import { postIdSchema } from './validation.js';

function identity(userId: string | undefined): string {
  if (!userId)
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  return userId;
}

function postNotFound(): AppError {
  return new AppError(404, 'NOT_FOUND', 'Post not found');
}

export function createInteractionController(service: PostInteractionService): {
  getLikeState: RequestHandler;
  like: RequestHandler;
  unlike: RequestHandler;
  createComment: RequestHandler;
  listComments: RequestHandler;
  deleteComment: RequestHandler;
} {
  return {
    getLikeState: async (req, res) => {
      const result = await service.getLikeState(
        postIdSchema.parse(req.params.postId),
        identity(req.auth?.userId),
      );
      if (!result) throw postNotFound();
      res.status(200).json(success(result));
    },
    like: async (req, res) => {
      emptyBodySchema.parse(req.body === undefined ? {} : req.body);
      const result = await service.like(
        postIdSchema.parse(req.params.postId),
        identity(req.auth?.userId),
      );
      if (!result) throw postNotFound();
      res.status(200).json(success(result));
    },
    unlike: async (req, res) => {
      emptyBodySchema.parse(req.body === undefined ? {} : req.body);
      const result = await service.unlike(
        postIdSchema.parse(req.params.postId),
        identity(req.auth?.userId),
      );
      if (!result) throw postNotFound();
      res.status(200).json(success(result));
    },
    createComment: async (req, res) => {
      const result = await service.createComment(
        postIdSchema.parse(req.params.postId),
        identity(req.auth?.userId),
        createCommentSchema.parse(req.body),
      );
      if (!result) throw postNotFound();
      res.status(201).json(success(result));
    },
    listComments: async (req, res) => {
      const result = await service.listComments(
        postIdSchema.parse(req.params.postId),
        listCommentsQuerySchema.parse(req.query),
      );
      if (!result) throw postNotFound();
      res.status(200).json(success(result));
    },
    deleteComment: async (req, res) => {
      emptyBodySchema.parse(req.body === undefined ? {} : req.body);
      const result = await service.deleteComment(
        postIdSchema.parse(req.params.postId),
        commentIdSchema.parse(req.params.commentId),
        identity(req.auth?.userId),
      );
      if (result === 'post_not_found') throw postNotFound();
      if (result === 'comment_not_found')
        throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      if (result === 'forbidden')
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      res.status(204).send();
    },
  };
}
