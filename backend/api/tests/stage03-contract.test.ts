import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { InMemoryUserRepository } from '../src/infrastructure/auth/in-memory-user-repository.js';
import type { SurgeStatusSource } from '../src/modules/surge/port.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  AUTH_ACCESS_TOKEN_SECRET: Buffer.alloc(32, 42).toString('base64url'),
});

const signupInput = {
  displayName: 'New Student',
  email: 'Student@Example.com',
  password: 'correct horse battery staple',
};

const userSchema = z.strictObject({
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

const authenticationSchema = z.strictObject({
  data: z.strictObject({
    user: userSchema,
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().int(),
  }),
});

function setup(source?: SurgeStatusSource) {
  const users = new InMemoryUserRepository();
  const app = source
    ? createApp(config, { users }, source)
    : createApp(config, { users });
  return { app, users };
}

describe('Stage 0.3 mobile contract', () => {
  it('signs up with the exact public User DTO and secure token response', async () => {
    const { app, users } = setup();
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send(signupInput);
    const data = authenticationSchema.parse(response.body).data;

    expect(response.status).toBe(201);
    expect(data.user).toEqual({
      id: data.user.id,
      username: 'student',
      displayName: 'New Student',
      email: 'student@example.com',
      avatarUrl: null,
      auraLevel: 0,
      interests: [],
      onboardingComplete: false,
    });
    expect(data.expiresIn).toBe(900);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain(signupInput.password);
    const stored = await users.findByEmail('student@example.com');
    expect(stored?.role).toBe('user');
    expect(stored?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('sanitizes the email local-part into the temporary username format', async () => {
    const { app } = setup();
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...signupInput, email: 'First.Last+Tag@Example.com' });

    expect(response.status).toBe(201);
    expect(authenticationSchema.parse(response.body).data.user.username).toBe(
      'first_last_tag',
    );
  });

  it('allocates unique usernames under concurrent local-part collisions', async () => {
    const { app, users } = setup();
    const [first, second] = await Promise.all([
      request(app)
        .post('/api/v1/auth/signup')
        .send({ ...signupInput, email: 'Sam@example.com' }),
      request(app)
        .post('/api/v1/auth/signup')
        .send({ ...signupInput, email: 'SAM@campus.edu' }),
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const names = [
      authenticationSchema.parse(first.body).data.user.username,
      authenticationSchema.parse(second.body).data.user.username,
    ];
    expect(names.sort()).toEqual(['sam', 'sam_2']);

    const existing = await users.findByEmail('sam@example.com');
    expect(existing).not.toBeNull();
    if (!existing) throw new Error('Expected registered user');
    expect(
      await users.create({
        ...existing,
        id: randomUUID(),
        email: 'different@example.com',
        username: 'SAM',
      }),
    ).toBe('username_conflict');
  });

  it('rejects role injection and returns exact frontend error codes', async () => {
    const { app } = setup();
    const injected = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...signupInput, role: 'admin' });
    expect(injected.status).toBe(400);
    expect(injected.body).toMatchObject({ code: 'VALIDATION_ERROR' });

    const invalid = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...signupInput, email: 'not-an-email' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toMatchObject({ code: 'VALIDATION_ERROR' });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@example.com',
      password: signupInput.password,
    });
    expect(login.status).toBe(401);
    expect(login.body).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      details: {},
      requestId: login.headers['x-request-id'],
    });
  });

  it('requires authentication for onboarding and session restore', async () => {
    const { app } = setup();
    const onboarding = await request(app)
      .post('/api/v1/auth/onboarding')
      .send({ interests: ['music'] });
    const session = await request(app).get('/api/v1/auth/session');
    for (const response of [onboarding, session]) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
        details: {},
        requestId: response.headers['x-request-id'],
      });
    }
  });

  it('trims and deduplicates interests, completes onboarding, and restores the updated session', async () => {
    const { app, users } = setup();
    const signedUp = await request(app)
      .post('/api/v1/auth/signup')
      .send(signupInput);
    const { accessToken, user } = authenticationSchema.parse(
      signedUp.body,
    ).data;

    const onboarding = await request(app)
      .post('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ interests: [' Music ', 'music', 'SPORTS', ' sports '] });
    expect(onboarding.status).toBe(200);
    const updated = z
      .strictObject({ data: userSchema })
      .parse(onboarding.body).data;
    expect(updated.interests).toEqual(['Music', 'SPORTS']);
    expect(updated.onboardingComplete).toBe(true);
    expect(updated.id).toBe(user.id);
    expect(JSON.stringify(onboarding.body)).not.toContain('passwordHash');

    const session = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(session.status).toBe(200);
    expect(
      z.strictObject({ data: userSchema }).parse(session.body).data,
    ).toEqual(updated);
    expect((await users.findById(user.id))?.onboardingComplete).toBe(true);
  });

  it.each([
    { interests: 'music' },
    { interests: ['music', ' '] },
    { interests: Array.from({ length: 11 }, (_, index) => `interest${index}`) },
    { interests: ['x'.repeat(41)] },
  ])('rejects invalid interests', async (input) => {
    const { app } = setup();
    const signedUp = await request(app)
      .post('/api/v1/auth/signup')
      .send(signupInput);
    const { accessToken } = authenticationSchema.parse(signedUp.body).data;
    const response = await request(app)
      .post('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(input);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      requestId: response.headers['x-request-id'],
    });
  });

  it('keeps Surge status inactive until a real status source is installed', async () => {
    const { app } = setup();
    const response = await request(app).get('/api/v1/surge/status');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: { isActive: false, startsAt: null, endsAt: null },
    });
  });

  it('takes Surge status from the injected source', async () => {
    const source: SurgeStatusSource = {
      getStatus: () =>
        Promise.resolve({
          isActive: true,
          startsAt: '2026-10-03T18:00:00.000Z',
          endsAt: '2026-10-03T19:00:00.000Z',
        }),
    };
    const { app } = setup(source);
    const response = await request(app).get('/api/v1/surge/status');
    expect(response.body).toEqual({
      data: {
        isActive: true,
        startsAt: '2026-10-03T18:00:00.000Z',
        endsAt: '2026-10-03T19:00:00.000Z',
      },
    });
  });
});
