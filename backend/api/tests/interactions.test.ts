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

const commentSchema = z.strictObject({
  id: z.uuid(),
  postId: z.uuid(),
  authorId: z.uuid(),
  text: z.string(),
  createdAt: z.iso.datetime(),
});
const commentResponseSchema = z.strictObject({ data: commentSchema });
const commentPageResponseSchema = z.strictObject({
  data: z.strictObject({
    items: z.array(commentSchema),
    nextCursor: z.string().nullable(),
  }),
});
const postCountsResponseSchema = z.object({
  data: z.object({ likesCount: z.number(), commentsCount: z.number() }),
});
const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
});

type App = ReturnType<typeof createApp>;

async function signup(app: App, email: string) {
  const response = await request(app).post('/api/v1/auth/signup').send({
    email,
    password: 'correct horse battery staple',
    displayName: 'Student',
  });
  expect(response.status).toBe(201);
  const data = z
    .object({
      data: z.object({
        accessToken: z.string(),
        user: z.object({ id: z.uuid() }),
      }),
    })
    .parse(response.body).data;
  return { id: data.user.id, bearer: `Bearer ${data.accessToken}` };
}

async function createPost(app: App, bearer: string) {
  const response = await request(app)
    .post('/api/v1/posts')
    .set('Authorization', bearer)
    .send({ text: 'Campus post' });
  expect(response.status).toBe(201);
  return z.object({ data: z.object({ id: z.uuid() }) }).parse(response.body)
    .data.id;
}

function expectError(
  response: { status: number; body: unknown },
  status: number,
  code: string,
) {
  expect(response.status).toBe(status);
  const body = errorSchema.parse(response.body);
  expect(body.code).toBe(code);
  expect(body.message.length).toBeGreaterThan(0);
  expect(body.requestId.length).toBeGreaterThan(0);
}

describe('post likes', () => {
  it('uses the authenticated user, keeps duplicates idempotent, and updates post count', async () => {
    const app = createApp(config);
    const author = await signup(app, 'author@example.com');
    const other = await signup(app, 'other@example.com');
    const postId = await createPost(app, author.bearer);
    const path = `/api/v1/posts/${postId}/likes`;

    const initial = await request(app)
      .get(`${path}/me`)
      .set('Authorization', other.bearer);
    expect(initial.body).toEqual({
      data: { postId, liked: false, likesCount: 0 },
    });
    expectError(await request(app).post(path), 401, 'UNAUTHENTICATED');
    expectError(
      await request(app)
        .post(path)
        .set('Authorization', other.bearer)
        .send({ userId: author.id }),
      400,
      'VALIDATION_ERROR',
    );
    expectError(
      await request(app)
        .post(path)
        .set('Authorization', other.bearer)
        .set('Content-Type', 'application/json')
        .send('null'),
      400,
      'BAD_REQUEST',
    );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const liked = await request(app)
        .post(path)
        .set('Authorization', other.bearer);
      expect(liked.body).toEqual({
        data: { postId, liked: true, likesCount: 1 },
      });
    }
    const post = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', author.bearer);
    const counts = postCountsResponseSchema.parse(post.body).data;
    expect(counts.likesCount).toBe(1);
    expect(counts.commentsCount).toBe(0);
    const authorLikeState = await request(app)
      .get(`${path}/me`)
      .set('Authorization', author.bearer);
    expect(authorLikeState.body).toEqual({
      data: { postId, liked: false, likesCount: 1 },
    });
    const postList = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', author.bearer);
    const listedPost = z
      .object({
        data: z.object({
          items: z.array(z.object({ likesCount: z.number() })),
        }),
      })
      .parse(postList.body).data.items[0];
    expect(listedPost?.likesCount).toBe(1);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const unliked = await request(app)
        .delete(path)
        .set('Authorization', other.bearer);
      expect(unliked.body).toEqual({
        data: { postId, liked: false, likesCount: 0 },
      });
    }
  });

  it('returns missing-post errors and removes like state when a post is deleted', async () => {
    const app = createApp(config);
    const author = await signup(app, 'author@example.com');
    const postId = await createPost(app, author.bearer);
    const path = `/api/v1/posts/${postId}/likes`;
    await request(app).post(path).set('Authorization', author.bearer);
    expect(
      (
        await request(app)
          .delete(`/api/v1/posts/${postId}`)
          .set('Authorization', author.bearer)
      ).status,
    ).toBe(204);
    expectError(
      await request(app).get(`${path}/me`).set('Authorization', author.bearer),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app).post(path).set('Authorization', author.bearer),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .delete(`/api/v1/posts/${randomUUID()}/likes`)
        .set('Authorization', author.bearer),
      404,
      'NOT_FOUND',
    );
  });
});

describe('post comments', () => {
  it('creates, trims, lists, and paginates comments with correct counts', async () => {
    const fixed = new Date('2026-10-05T12:00:00.000Z');
    const app = createApp(config, { clock: { now: () => fixed } });
    const author = await signup(app, 'author@example.com');
    const commenter = await signup(app, 'commenter@example.com');
    const postId = await createPost(app, author.bearer);
    const path = `/api/v1/posts/${postId}/comments`;
    const ids: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await request(app)
        .post(path)
        .set('Authorization', commenter.bearer)
        .send({ text: `  Comment ${index}  ` });
      expect(response.status).toBe(201);
      const comment = commentResponseSchema.parse(response.body).data;
      expect(comment).toMatchObject({
        postId,
        authorId: commenter.id,
        text: `Comment ${index}`,
      });
      ids.push(comment.id);
    }
    const first = await request(app)
      .get(path)
      .set('Authorization', author.bearer)
      .query({ limit: 2 });
    expect(first.status).toBe(200);
    const firstPage = commentPageResponseSchema.parse(first.body).data;
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    const second = await request(app)
      .get(path)
      .set('Authorization', author.bearer)
      .query({ limit: 2, cursor: firstPage.nextCursor });
    expect(second.status).toBe(200);
    const secondPage = commentPageResponseSchema.parse(second.body).data;
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(
      [...firstPage.items, ...secondPage.items].map((comment) => comment.id),
    ).toEqual([...ids].sort());
    const post = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', author.bearer);
    expect(postCountsResponseSchema.parse(post.body).data.commentsCount).toBe(
      3,
    );
  });

  it('allows only the comment author to delete, including against the post owner', async () => {
    const app = createApp(config);
    const author = await signup(app, 'author@example.com');
    const commenter = await signup(app, 'commenter@example.com');
    const postId = await createPost(app, author.bearer);
    const path = `/api/v1/posts/${postId}/comments`;
    const created = await request(app)
      .post(path)
      .set('Authorization', commenter.bearer)
      .send({ text: 'Mine' });
    const comment = commentResponseSchema.parse(created.body).data;
    expectError(
      await request(app)
        .delete(`${path}/${comment.id}`)
        .set('Authorization', author.bearer),
      403,
      'FORBIDDEN',
    );
    expect(
      (
        await request(app)
          .delete(`${path}/${comment.id}`)
          .set('Authorization', commenter.bearer)
      ).status,
    ).toBe(204);
    expectError(
      await request(app)
        .delete(`${path}/${comment.id}`)
        .set('Authorization', commenter.bearer),
      404,
      'NOT_FOUND',
    );
    const post = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', author.bearer);
    expect(postCountsResponseSchema.parse(post.body).data.commentsCount).toBe(
      0,
    );
  });

  it('rejects missing posts, invalid input, ownership fields, and unauthenticated access', async () => {
    const app = createApp(config);
    const user = await signup(app, 'author@example.com');
    const postId = await createPost(app, user.bearer);
    const path = `/api/v1/posts/${postId}/comments`;
    expectError(
      await request(app).post(path).send({ text: 'Hello' }),
      401,
      'UNAUTHENTICATED',
    );
    for (const body of [
      {},
      { text: ' ' },
      { text: 'x'.repeat(1001) },
      { text: 'Hi', authorId: user.id },
      { text: 'Hi', role: 'admin' },
    ]) {
      expectError(
        await request(app)
          .post(path)
          .set('Authorization', user.bearer)
          .send(body),
        400,
        'VALIDATION_ERROR',
      );
    }
    for (const query of [
      { limit: 0 },
      { limit: 51 },
      { cursor: 'bad' },
      { extra: 'x' },
    ]) {
      expectError(
        await request(app)
          .get(path)
          .set('Authorization', user.bearer)
          .query(query),
        400,
        'VALIDATION_ERROR',
      );
    }
    expectError(
      await request(app)
        .get(`/api/v1/posts/${randomUUID()}/comments`)
        .set('Authorization', user.bearer),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .post(`/api/v1/posts/${randomUUID()}/comments`)
        .set('Authorization', user.bearer)
        .send({ text: 'Hi' }),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .delete(`${path}/${randomUUID()}`)
        .set('Authorization', user.bearer),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .delete(`${path}/${randomUUID()}`)
        .set('Authorization', user.bearer)
        .send({ authorId: user.id }),
      400,
      'VALIDATION_ERROR',
    );
    expectError(
      await request(app)
        .get('/api/v1/posts/not-a-uuid/comments')
        .set('Authorization', user.bearer),
      400,
      'VALIDATION_ERROR',
    );
  });

  it('makes comments inaccessible after the owning post is deleted', async () => {
    const app = createApp(config);
    const author = await signup(app, 'author@example.com');
    const postId = await createPost(app, author.bearer);
    const path = `/api/v1/posts/${postId}/comments`;
    const created = await request(app)
      .post(path)
      .set('Authorization', author.bearer)
      .send({ text: 'Will disappear' });
    const commentId = commentResponseSchema.parse(created.body).data.id;
    await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', author.bearer);
    expectError(
      await request(app).get(path).set('Authorization', author.bearer),
      404,
      'NOT_FOUND',
    );
    expectError(
      await request(app)
        .delete(`${path}/${commentId}`)
        .set('Authorization', author.bearer),
      404,
      'NOT_FOUND',
    );
  });
});
