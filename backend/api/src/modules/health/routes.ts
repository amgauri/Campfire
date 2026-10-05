import { Router } from 'express';
import { success } from '../../http/response/success.js';
import { AppError } from '../../http/errors/app-error.js';

export function createHealthRouter(readinessCheck: () => Promise<boolean>) {
  const healthRouter = Router();

  healthRouter.get('/live', (_req, res) => {
    res.status(200).json(success({ status: 'ok' }));
  });

  healthRouter.get('/ready', async (_req, res, next) => {
    try {
      if (!(await readinessCheck())) {
        throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Service is not ready');
      }
      res.status(200).json(success({ status: 'ready' }));
    } catch (error) {
      next(error);
    }
  });

  return healthRouter;
}
