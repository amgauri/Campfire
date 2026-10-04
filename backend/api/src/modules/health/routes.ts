import { Router } from 'express';
import { success } from '../../http/response/success.js';

export const healthRouter = Router();

healthRouter.get('/live', (_req, res) => {
  res.status(200).json(success({ status: 'ok' }));
});
