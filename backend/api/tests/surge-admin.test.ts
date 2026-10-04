import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { Argon2PasswordHasher } from '../src/infrastructure/auth/argon2-password-hasher.js';
import { InMemoryUserRepository } from '../src/infrastructure/auth/in-memory-user-repository.js';
import { JwtAccessTokenProvider } from '../src/infrastructure/auth/jwt-access-token-provider.js';
import { InMemorySurgeStatusRepository } from '../src/infrastructure/surge/in-memory-surge-status-repository.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  AUTH_ACCESS_TOKEN_SECRET: Buffer.alloc(32, 42).toString('base64url'),
});

async function signup(app: ReturnType<typeof createApp>) {
  const response = await request(app).post('/api/v1/auth/signup').send({
    email: 'user@example.com',
    password: 'correct horse battery staple',
    displayName: 'Student',
  });
  expect(response.status).toBe(201);
  const body = z
    .object({ data: z.object({ accessToken: z.string() }) })
    .parse(response.body);
  return `Bearer ${body.data.accessToken}`;
}

describe('admin Surge override', () => {
  it('rejects anonymous users, normal users, and client role injection', async () => {
    const app = createApp(config);
    const path = '/api/v1/admin/surge/override';
    const userToken = await signup(app);
    const anonymous = await request(app).put(path).send({ isActive: true });
    expect(anonymous.status).toBe(401);
    expect(z.object({ code: z.string() }).parse(anonymous.body).code).toBe(
      'UNAUTHENTICATED',
    );
    const forbidden = await request(app)
      .put(path)
      .set('Authorization', userToken)
      .send({ isActive: true });
    expect(forbidden.status).toBe(403);
    expect(z.object({ code: z.string() }).parse(forbidden.body).code).toBe(
      'FORBIDDEN',
    );
    const injected = await request(app)
      .put(path)
      .set('Authorization', userToken)
      .send({ isActive: true, role: 'admin' });
    expect(injected.status).toBe(403);
    const status = await request(app).get('/api/v1/surge/status');
    expect(status.body).toEqual({
      data: { isActive: false, startsAt: null, endsAt: null },
    });
  });

  it('allows only a trusted repository admin and keeps public status authoritative', async () => {
    const users = new InMemoryUserRepository();
    const now = new Date('2026-10-05T12:00:00.000Z').toISOString();
    const id = randomUUID();
    await users.create({
      id,
      username: 'trusted_admin',
      email: 'trusted@example.com',
      passwordHash: await new Argon2PasswordHasher().hash(
        'correct horse battery staple',
      ),
      displayName: 'Trusted Admin',
      avatarUrl: null,
      auraLevel: 0,
      interests: [],
      onboardingComplete: false,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    const source = new InMemorySurgeStatusRepository();
    const app = createApp(config, { users }, source);
    const token = await new JwtAccessTokenProvider(
      config.authAccessTokenSecret,
      900,
      { now: () => new Date() },
    ).issue({ userId: id, role: 'admin' });
    const path = '/api/v1/admin/surge/override';

    const invalid = await request(app)
      .put(path)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: 'true' });
    expect(invalid.status).toBe(400);
    expect(z.object({ code: z.string() }).parse(invalid.body).code).toBe(
      'VALIDATION_ERROR',
    );
    const started = await request(app)
      .put(path)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: true });
    expect(started.status).toBe(200);
    expect(started.body).toEqual({
      data: { isActive: true, startsAt: null, endsAt: null },
    });
    const publicStatus = await request(app).get('/api/v1/surge/status');
    expect(publicStatus.body).toEqual(started.body);
    const ended = await request(app)
      .put(path)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });
    expect(ended.body).toEqual({
      data: { isActive: false, startsAt: null, endsAt: null },
    });
  });
});
