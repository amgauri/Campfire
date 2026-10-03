import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { errorHandler } from '../src/http/errors/error-handler.js';
import { requestIdMiddleware } from '../src/http/middleware/request-id.js';
import { requireRole } from '../src/modules/auth/middleware.js';

describe('role authorization middleware', () => {
  it('distinguishes unauthenticated and forbidden requests', async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      AUTH_ACCESS_TOKEN_SECRET: Buffer.alloc(32, 42).toString('base64url'),
    });
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/anonymous', requireRole('admin'), (_req, res) =>
      res.sendStatus(204),
    );
    app.get(
      '/user',
      (req, res, next) => {
        req.auth = {
          userId: '00000000-0000-4000-8000-000000000000',
          role: 'user',
        };
        void res;
        next();
      },
      requireRole('admin'),
      (_req, res) => res.sendStatus(204),
    );
    app.use(errorHandler(createLogger(config)));

    const unauthenticated = await request(app).get('/anonymous');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toMatchObject({
      code: 'UNAUTHENTICATED',
      requestId: unauthenticated.headers['x-request-id'],
    });

    const forbidden = await request(app).get('/user');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toMatchObject({
      code: 'FORBIDDEN',
      requestId: forbidden.headers['x-request-id'],
    });
  });
});
