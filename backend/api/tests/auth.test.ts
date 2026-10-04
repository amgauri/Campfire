import { decodeJwt } from 'jose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { InMemoryUserRepository } from '../src/infrastructure/auth/in-memory-user-repository.js';
import type { Clock } from '../src/modules/auth/ports.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  AUTH_ACCESS_TOKEN_SECRET: Buffer.alloc(32, 42).toString('base64url'),
});

const registration = {
  email: 'Student@Example.com',
  password: 'correct horse battery staple',
  displayName: 'Student',
};

const publicUserSchema = z.strictObject({
  id: z.uuid(),
  username: z
    .string()
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    .max(32),
  displayName: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  auraLevel: z.number().int().min(0).max(3),
  interests: z.array(z.string()),
  onboardingComplete: z.boolean(),
});

const authResponseSchema = z.strictObject({
  data: z.strictObject({
    user: publicUserSchema,
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().int(),
  }),
});

const refreshResponseSchema = z.strictObject({
  data: z.strictObject({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().int(),
  }),
});

function setup(clock?: Clock) {
  const users = new InMemoryUserRepository();
  return {
    app: createApp(config, clock ? { users, clock } : { users }),
    users,
  };
}

function errorCode(body: unknown): string {
  return z.object({ code: z.string() }).parse(body).code;
}

describe('mobile authentication', () => {
  it('registers a user, normalizes email, hashes the password, and returns public data', async () => {
    const { app, users } = setup();
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const body = authResponseSchema.parse(response.body);

    expect(response.status).toBe(201);
    expect(body.data.user).toMatchObject({
      username: 'student',
      email: 'student@example.com',
      displayName: 'Student',
      avatarUrl: null,
      auraLevel: 0,
      interests: [],
      onboardingComplete: false,
    });
    expect(body.data.expiresIn).toBe(900);
    expect(JSON.stringify(response.body)).not.toContain(registration.password);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const claims = decodeJwt(body.data.accessToken);
    expect(claims).toMatchObject({
      sub: body.data.user.id,
      role: 'user',
      tokenUse: 'access',
      iss: 'campfire-api',
      aud: 'campfire-mobile',
    });
    expect(claims.jti).toBeTypeOf('string');
    expect(claims.exp).toBeTypeOf('number');
    expect(claims).not.toHaveProperty('email');
    expect(claims).not.toHaveProperty('displayName');

    const stored = await users.findByEmail('student@example.com');
    expect(stored?.role).toBe('user');
    expect(stored?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(stored?.passwordHash).not.toBe(registration.password);
  });

  it('rejects duplicate email regardless of casing', async () => {
    const { app } = setup();
    await request(app).post('/api/v1/auth/register').send(registration);
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registration, email: ' student@example.com ' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      code: 'EMAIL_IN_USE',
      message: 'Email is already registered',
      details: {},
      requestId: response.headers['x-request-id'],
    });
  });

  it('cannot assign an admin role through public registration', async () => {
    const { app, users } = setup();
    const rejected = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registration, role: 'admin' });
    expect(rejected.status).toBe(400);
    expect(rejected.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId: rejected.headers['x-request-id'],
    });

    const accepted = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    expect(authResponseSchema.parse(accepted.body).data.user.username).toBe(
      'student',
    );
    expect((await users.findByEmail('student@example.com'))?.role).toBe('user');
  });

  it.each([
    [{ ...registration, email: 'invalid-email' }, 'email'],
    [{ ...registration, password: 'short' }, 'password'],
    [{ ...registration, displayName: '' }, 'displayName'],
  ])('rejects invalid registration input', async (input, field) => {
    const { app } = setup();
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(input);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      requestId: response.headers['x-request-id'],
    });
    expect(JSON.stringify(response.body)).toContain(field);
    expect(JSON.stringify(response.body)).not.toContain(registration.password);
  });

  it('logs in with a normalized email and keeps credential failures generic', async () => {
    const { app } = setup();
    await request(app).post('/api/v1/auth/register').send(registration);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: ' STUDENT@example.com ',
      password: registration.password,
    });
    expect(login.status).toBe(200);
    expect(authResponseSchema.parse(login.body).data.user.email).toBe(
      'student@example.com',
    );

    for (const email of ['student@example.com', 'missing@example.com']) {
      const failed = await request(app).post('/api/v1/auth/login').send({
        email,
        password: 'incorrect password',
      });
      expect(failed.status).toBe(401);
      expect(failed.body).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        details: {},
        requestId: failed.headers['x-request-id'],
      });
    }
  });

  it('accepts a valid Bearer token for /me and rejects missing or malformed headers', async () => {
    const { app } = setup();
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const { accessToken } = authResponseSchema.parse(registered.body).data;

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(z.object({ data: publicUserSchema }).parse(me.body).data.email).toBe(
      'student@example.com',
    );

    for (const header of [
      undefined,
      `Basic ${accessToken}`,
      'Bearer',
      'Bearer bad token',
      'Bearer invalid',
    ]) {
      const pending = request(app).get('/api/v1/auth/me');
      const response = await (header
        ? pending.set('Authorization', header)
        : pending);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
        details: {},
        requestId: response.headers['x-request-id'],
      });
    }
  });

  it('rejects an expired access token', async () => {
    let now = new Date('2026-01-01T00:00:00.000Z');
    const clock: Clock = { now: () => now };
    const { app } = setup(clock);
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const { accessToken } = authResponseSchema.parse(registered.body).data;
    now = new Date('2026-01-01T00:15:01.000Z');

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(response.status).toBe(401);
    expect(errorCode(response.body)).toBe('UNAUTHENTICATED');
  });

  it('rotates refresh tokens and revokes the family after replay', async () => {
    const { app } = setup();
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const first = authResponseSchema.parse(registered.body).data.refreshToken;

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first });
    expect(refreshed.status).toBe(200);
    const second = refreshResponseSchema.parse(refreshed.body).data;
    expect(second.refreshToken).not.toBe(first);
    expect(second.expiresIn).toBe(900);

    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first });
    expect(replay.status).toBe(401);
    expect(errorCode(replay.body)).toBe('INVALID_REFRESH_TOKEN');

    const familyRevoked = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: second.refreshToken });
    expect(familyRevoked.status).toBe(401);
  });

  it('rejects expired and malformed refresh tokens', async () => {
    let now = new Date('2026-01-01T00:00:00.000Z');
    const { app } = setup({ now: () => now });
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const token = authResponseSchema.parse(registered.body).data.refreshToken;
    now = new Date('2026-02-01T00:00:00.000Z');

    const expired = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });
    expect(expired.status).toBe(401);
    expect(errorCode(expired.body)).toBe('INVALID_REFRESH_TOKEN');

    const malformed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'bad' });
    expect(malformed.status).toBe(401);
    expect(errorCode(malformed.body)).toBe('INVALID_REFRESH_TOKEN');
  });

  it('does not extend the original refresh-session expiry during rotation', async () => {
    let now = new Date('2026-01-01T00:00:00.000Z');
    const { app } = setup({ now: () => now });
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const first = authResponseSchema.parse(registered.body).data.refreshToken;

    now = new Date('2026-01-30T00:00:00.000Z');
    const rotated = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first });
    expect(rotated.status).toBe(200);
    const second = refreshResponseSchema.parse(rotated.body).data.refreshToken;

    now = new Date('2026-02-01T00:00:00.000Z');
    const expired = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: second });
    expect(expired.status).toBe(401);
    expect(errorCode(expired.body)).toBe('INVALID_REFRESH_TOKEN');
  });

  it('invalidates refresh capability on logout', async () => {
    const { app } = setup();
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send(registration);
    const token = authResponseSchema.parse(registered.body).data.refreshToken;

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: token });
    expect(logout.status).toBe(204);
    expect(logout.text).toBe('');

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });
    expect(refresh.status).toBe(401);
  });

  it('returns public errors for malformed auth bodies', async () => {
    const { app } = setup();
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'student@example.com',
      password: 123,
    });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: { issues: [{ field: 'password', code: 'invalid_type' }] },
      requestId: response.headers['x-request-id'],
    });
  });

  it('rate limits repeated registration attempts using the public error shape', async () => {
    const { app } = setup();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});
      expect(response.status).toBe(400);
    }
    const limited = await request(app).post('/api/v1/auth/register').send({});
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      details: {},
      requestId: limited.headers['x-request-id'],
    });
  });
});
