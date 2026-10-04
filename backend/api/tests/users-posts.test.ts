import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  AUTH_ACCESS_TOKEN_SECRET: Buffer.alloc(32, 42).toString('base64url'),
});

const ownUserSchema = z.strictObject({
  id: z.uuid(),
  username: z.string(),
  displayName: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  auraLevel: z.number().int(),
  interests: z.array(z.string()),
  onboardingComplete: z.boolean(),
});

const publicProfileSchema = ownUserSchema.omit({
  email: true,
  onboardingComplete: true,
});
const ownUserResponseSchema = z.strictObject({ data: ownUserSchema });
const publicProfileResponseSchema = z.strictObject({
  data: publicProfileSchema,
});

const postSchema = z.strictObject({
  id: z.uuid(),
  authorId: z.uuid(),
  text: z.string(),
  mediaUrl: z.string().nullable(),
  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const postResponseSchema = z.strictObject({ data: postSchema });

const postListSchema = z.strictObject({
  data: z.strictObject({
    items: z.array(postSchema),
    nextCursor: z.string().nullable(),
  }),
});

type App = ReturnType<typeof createApp>;

async function signup(app: App, email: string) {
  const response = await request(app).post('/api/v1/auth/signup').send({
    email,
    password: 'correct horse battery staple',
    displayName: 'Original Name',
  });
  expect(response.status).toBe(201);
  const body = z
    .strictObject({
      data: z.strictObject({
        user: ownUserSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        expiresIn: z.number(),
      }),
    })
    .parse(response.body);
  return body.data;
}

function bearer(token: string): string {
  return `Bearer ${token}`;
}

function expectError(
  response: { status: number; body: unknown; headers: Record<string, string> },
  status: number,
  code: string,
) {
  expect(response.status).toBe(status);
  const error = z
    .strictObject({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()),
      requestId: z.string(),
    })
    .parse(response.body);
  expect(error.code).toBe(code);
  expect(error.message.length).toBeGreaterThan(0);
  expect(error.requestId).toBe(response.headers['x-request-id']);
}

describe('users and profiles', () => {
  it('returns an own profile with email and a public profile without private fields', async () => {
    const app = createApp(config);
    const first = await signup(app, 'first@example.com');
    const second = await signup(app, 'second@example.com');

    const own = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', bearer(first.accessToken));
    expect(own.status).toBe(200);
    expect(ownUserResponseSchema.parse(own.body).data).toEqual(first.user);

    const publicResponse = await request(app).get(
      `/api/v1/users/${second.user.id}`,
    );
    expect(publicResponse.status).toBe(200);
    const publicProfile = publicProfileResponseSchema.parse(
      publicResponse.body,
    ).data;
    expect(publicProfile.id).toBe(second.user.id);
    expect(publicProfile).not.toHaveProperty('email');
    for (const response of [own, publicResponse]) {
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('role');
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('verifierHash');
    }
  });

  it('updates only the authenticated user display name and shares state with auth/session', async () => {
    const app = createApp(config);
    const first = await signup(app, 'first@example.com');
    const second = await signup(app, 'second@example.com');

    const updated = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', bearer(first.accessToken))
      .send({ displayName: '  New Name  ' });
    expect(updated.status).toBe(200);
    const updatedUser = ownUserResponseSchema.parse(updated.body).data;
    expect(updatedUser.displayName).toBe('New Name');
    expect(updatedUser.id).toBe(first.user.id);

    const session = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', bearer(first.accessToken));
    expect(ownUserResponseSchema.parse(session.body).data.displayName).toBe(
      'New Name',
    );

    const other = await request(app).get(`/api/v1/users/${second.user.id}`);
    expect(publicProfileResponseSchema.parse(other.body).data.displayName).toBe(
      'Original Name',
    );
  });

  it('rejects unauthenticated, invalid, and privilege-changing profile requests', async () => {
    const app = createApp(config);
    const user = await signup(app, 'first@example.com');

    expectError(
      await request(app).get('/api/v1/users/me'),
      401,
      'UNAUTHENTICATED',
    );
    expectError(
      await request(app).patch('/api/v1/users/me').send({ displayName: 'No' }),
      401,
      'UNAUTHENTICATED',
    );
    for (const body of [
      {},
      { displayName: ' ' },
      { displayName: 'x'.repeat(81) },
      { displayName: 'Valid', role: 'admin' },
      { displayName: 'Valid', email: 'changed@example.com' },
      { displayName: 'Valid', avatarUrl: 'https://example.com/a.png' },
    ]) {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', bearer(user.accessToken))
        .send(body);
      expectError(response, 400, 'VALIDATION_ERROR');
    }
    expectError(
      await request(app).get('/api/v1/users/not-a-uuid'),
      400,
      'VALIDATION_ERROR',
    );
    expectError(
      await request(app).get(`/api/v1/users/${randomUUID()}`),
      404,
      'NOT_FOUND',
    );
  });
});

describe('posts', () => {
  it('creates and retrieves a post using the authenticated author identity', async () => {
    const app = createApp(config);
    const user = await signup(app, 'author@example.com');
    const created = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', bearer(user.accessToken))
      .send({
        text: '  Hello campus  ',
        mediaUrl: 'https://example.com/a.png',
      });
    expect(created.status).toBe(201);
    const post = postResponseSchema.parse(created.body).data;
    expect(post).toMatchObject({
      authorId: user.user.id,
      text: 'Hello campus',
      mediaUrl: 'https://example.com/a.png',
    });
    expect(post.createdAt).toMatch(/Z$/);
    expect(post.updatedAt).toBe(post.createdAt);
    expect(JSON.stringify(created.body)).not.toContain('passwordHash');
    expect(JSON.stringify(created.body)).not.toContain(user.user.email);

    const fetched = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Authorization', bearer(user.accessToken));
    expect(fetched.status).toBe(200);
    expect(postResponseSchema.parse(fetched.body).data).toEqual(post);
  });

  it('enforces authentication and strict post creation validation', async () => {
    const app = createApp(config);
    const user = await signup(app, 'author@example.com');
    expectError(
      await request(app).post('/api/v1/posts').send({ text: 'Hello' }),
      401,
      'UNAUTHENTICATED',
    );
    for (const body of [
      {},
      { text: '   ' },
      { text: 'x'.repeat(2001) },
      { text: 'Hello', authorId: randomUUID() },
      { text: 'Hello', createdAt: new Date().toISOString() },
      { text: 'Hello', mediaUrl: 'http://example.com/a.png' },
      { text: 'Hello', mediaUrl: 'https://user:pass@example.com/a.png' },
    ]) {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', bearer(user.accessToken))
        .send(body);
      expectError(response, 400, 'VALIDATION_ERROR');
    }
  });

  it('returns safe errors for missing, malformed, and unauthenticated post reads', async () => {
    const app = createApp(config);
    const user = await signup(app, 'author@example.com');
    expectError(
      await request(app).get('/api/v1/posts'),
      401,
      'UNAUTHENTICATED',
    );
    expectError(
      await request(app).get(`/api/v1/posts/${randomUUID()}`),
      401,
      'UNAUTHENTICATED',
    );
    expectError(
      await request(app)
        .get('/api/v1/posts/not-a-uuid')
        .set('Authorization', bearer(user.accessToken)),
      400,
      'VALIDATION_ERROR',
    );
    expectError(
      await request(app)
        .get(`/api/v1/posts/${randomUUID()}`)
        .set('Authorization', bearer(user.accessToken)),
      404,
      'NOT_FOUND',
    );
  });

  it('lists posts with stable cursor pagination and author filtering', async () => {
    const fixed = new Date('2026-10-05T12:00:00.000Z');
    const app = createApp(config, { clock: { now: () => fixed } });
    const first = await signup(app, 'first@example.com');
    const second = await signup(app, 'second@example.com');
    const createdIds: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', bearer(first.accessToken))
        .send({ text: `Post ${index}` });
      expect(response.status).toBe(201);
      createdIds.push(postResponseSchema.parse(response.body).data.id);
    }
    const other = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', bearer(second.accessToken))
      .send({ text: 'Other author' });
    expect(other.status).toBe(201);

    let cursor: string | null = null;
    const collected: string[] = [];
    for (let pageNumber = 0; pageNumber < 3; pageNumber += 1) {
      const query = cursor ? { limit: 2, cursor } : { limit: 2 };
      const response = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', bearer(first.accessToken))
        .query(query);
      expect(response.status).toBe(200);
      const page = postListSchema.parse(response.body).data;
      expect(page.items).toHaveLength(2);
      collected.push(...page.items.map((post) => post.id));
      cursor = page.nextCursor;
      if (pageNumber < 2) expect(cursor).not.toBeNull();
    }
    expect(cursor).toBeNull();
    expect(new Set(collected).size).toBe(6);
    expect(collected).toEqual([...collected].sort().reverse());

    const filtered = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', bearer(first.accessToken))
      .query({ authorId: first.user.id, limit: 50 });
    const ownPosts = postListSchema.parse(filtered.body).data;
    expect(ownPosts.items.map((post) => post.id).sort()).toEqual(
      createdIds.sort(),
    );
    expect(ownPosts.nextCursor).toBeNull();
  });

  it('uses keyset cursor values even if the boundary post is deleted', async () => {
    const fixed = new Date('2026-10-05T12:00:00.000Z');
    const app = createApp(config, { clock: { now: () => fixed } });
    const user = await signup(app, 'author@example.com');
    for (let index = 0; index < 3; index += 1) {
      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', bearer(user.accessToken))
        .send({ text: `Post ${index}` });
    }
    const firstPage = postListSchema.parse(
      (
        await request(app)
          .get('/api/v1/posts')
          .set('Authorization', bearer(user.accessToken))
          .query({ limit: 1 })
      ).body,
    ).data;
    expect(firstPage.nextCursor).not.toBeNull();
    await request(app)
      .delete(`/api/v1/posts/${firstPage.items[0]?.id}`)
      .set('Authorization', bearer(user.accessToken));
    const nextPage = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', bearer(user.accessToken))
      .query({ limit: 2, cursor: firstPage.nextCursor });
    expect(nextPage.status).toBe(200);
    expect(postListSchema.parse(nextPage.body).data.items).toHaveLength(2);
  });

  it('rejects invalid pagination parameters', async () => {
    const app = createApp(config);
    const user = await signup(app, 'author@example.com');
    for (const query of [
      { limit: 0 },
      { limit: 51 },
      { limit: 'not-a-number' },
      { cursor: 'not-a-cursor' },
      { authorId: 'not-a-uuid' },
      { unexpected: 'value' },
    ]) {
      const response = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', bearer(user.accessToken))
        .query(query);
      expectError(response, 400, 'VALIDATION_ERROR');
    }
  });

  it('allows only the author to delete and then removes the post', async () => {
    const app = createApp(config);
    const author = await signup(app, 'author@example.com');
    const other = await signup(app, 'other@example.com');
    const created = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', bearer(author.accessToken))
      .send({ text: 'Owned post' });
    const post = postResponseSchema.parse(created.body).data;

    expectError(
      await request(app).delete(`/api/v1/posts/${post.id}`),
      401,
      'UNAUTHENTICATED',
    );
    expectError(
      await request(app)
        .delete(`/api/v1/posts/${post.id}`)
        .set('Authorization', bearer(other.accessToken)),
      403,
      'FORBIDDEN',
    );
    const deleted = await request(app)
      .delete(`/api/v1/posts/${post.id}`)
      .set('Authorization', bearer(author.accessToken));
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    expectError(
      await request(app)
        .get(`/api/v1/posts/${post.id}`)
        .set('Authorization', bearer(author.accessToken)),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .delete(`/api/v1/posts/${post.id}`)
        .set('Authorization', bearer(author.accessToken)),
      404,
      'NOT_FOUND',
    );
  });
});
