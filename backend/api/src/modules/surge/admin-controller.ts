import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../../http/errors/app-error.js';
import { success } from '../../http/response/success.js';
import type { SurgeStatusService } from './service.js';

const overrideSchema = z.strictObject({ isActive: z.boolean() });

export function surgeOverrideController(
  service: SurgeStatusService,
): RequestHandler {
  return async (req, res) => {
    const input = overrideSchema.parse(req.body);
    const result = service.setOverride(input.isActive);
    if (!result)
      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'Surge override unavailable',
      );
    res.status(200).json(success(await result));
  };
}
