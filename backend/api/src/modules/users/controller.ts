import type { RequestHandler } from 'express';
import { AppError } from '../../http/errors/app-error.js';
import { success } from '../../http/response/success.js';
import type { UserProfileService } from './service.js';
import { updateProfileSchema, userIdSchema } from './validation.js';

export function createUserProfileController(service: UserProfileService): {
  getOwn: RequestHandler;
  getPublic: RequestHandler;
  updateOwn: RequestHandler;
} {
  return {
    getOwn: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const user = await service.getOwn(req.auth.userId);
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      res.status(200).json(success(user));
    },
    getPublic: async (req, res) => {
      const userId = userIdSchema.parse(req.params.userId);
      const profile = await service.getPublic(userId);
      if (!profile) throw new AppError(404, 'NOT_FOUND', 'User not found');
      res.status(200).json(success(profile));
    },
    updateOwn: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const input = updateProfileSchema.parse(req.body);
      const user = await service.updateOwn(req.auth.userId, input);
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      res.status(200).json(success(user));
    },
  };
}
