import type { RequestHandler } from 'express';
import { AppError } from '../../http/errors/app-error.js';
import { success } from '../../http/response/success.js';
import type { AuthService } from './service.js';
import {
  loginSchema,
  onboardingSchema,
  refreshTokenSchema,
  registerSchema,
} from './validation.js';

export function createAuthController(service: AuthService): {
  register: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
  onboarding: RequestHandler;
} {
  return {
    register: async (req, res) => {
      const result = await service.register(registerSchema.parse(req.body));
      res.status(201).json(success(result));
    },
    login: async (req, res) => {
      const result = await service.login(loginSchema.parse(req.body));
      res.status(200).json(success(result));
    },
    refresh: async (req, res) => {
      const input = refreshTokenSchema.parse(req.body);
      res.status(200).json(success(await service.refresh(input.refreshToken)));
    },
    logout: async (req, res) => {
      const input = refreshTokenSchema.parse(req.body);
      await service.logout(input.refreshToken);
      res.status(204).send();
    },
    me: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      res.status(200).json(success(await service.me(req.auth.userId)));
    },
    onboarding: async (req, res) => {
      if (!req.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const input = onboardingSchema.parse(req.body);
      res
        .status(200)
        .json(
          success(await service.completeOnboarding(req.auth.userId, input)),
        );
    },
  };
}
