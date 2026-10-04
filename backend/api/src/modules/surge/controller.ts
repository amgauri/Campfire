import type { RequestHandler } from 'express';
import { success } from '../../http/response/success.js';
import type { SurgeStatusService } from './service.js';

export function surgeStatusController(
  service: SurgeStatusService,
): RequestHandler {
  return async (_req, res) => {
    res.status(200).json(success(await service.getStatus()));
  };
}
