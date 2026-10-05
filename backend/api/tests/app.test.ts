import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

const testSecret = Buffer.alloc(32, 42).toString('base64url');
const app = createApp(
  loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    CORS_ORIGINS: 'http://localhost:5173',
    AUTH_ACCESS_TOKEN_SECRET: testSecret,
  }),
);

describe('HTTP foundation', () => {
  it('returns a successful liveness response', async () => {
    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });

  it('reports readiness separately from liveness', async () => {
    const ready = await request(app).get('/api/v1/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({ data: { status: 'ready' } });

    const unavailable = createApp(
      loadConfig({
        NODE_ENV: 'test',
        LOG_LEVEL: 'silent',
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
      }),
      {},
      undefined,
      { readinessCheck: () => Promise.resolve(false) },
    );
    const notReady = await request(unavailable).get('/api/v1/health/ready');
    expect(notReady.status).toBe(503);
    const error = z
      .object({ code: z.string(), requestId: z.string() })
      .parse(notReady.body);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect((await request(unavailable).get('/api/v1/health/live')).status).toBe(
      200,
    );
  });

  it('does not silently use in-memory repositories in MongoDB mode', () => {
    const persistentConfig = loadConfig({
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PERSISTENCE_DRIVER: 'mongodb',
      MONGO_URI: 'mongodb://127.0.0.1/campfire',
      AUTH_ACCESS_TOKEN_SECRET: testSecret,
    });
    expect(() => createApp(persistentConfig)).toThrow(
      'MongoDB persistence requires all durable repositories',
    );
  });

  it('returns the standard 404 error with a matching request ID', async () => {
    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: {},
      requestId: response.headers['x-request-id'],
    });
  });

  it('handles malformed JSON without exposing parser internals', async () => {
    const response = await request(app)
      .post('/api/v1/health/live')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: 'BAD_REQUEST',
      message: 'Malformed JSON body',
      details: {},
      requestId: response.headers['x-request-id'],
    });
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });

  it('rejects oversized JSON safely', async () => {
    const response = await request(app)
      .post('/api/v1/health/live')
      .send({ body: 'x'.repeat(110 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large',
      details: {},
      requestId: response.headers['x-request-id'],
    });
  });

  it('returns a distinct request ID on every request', async () => {
    const first = await request(app).get('/api/v1/health/live');
    const second = await request(app).get('/api/v1/health/live');

    expect(first.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.headers['x-request-id']).not.toBe(
      second.headers['x-request-id'],
    );
  });
});
