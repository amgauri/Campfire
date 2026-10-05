import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import {
  connectDB,
  disconnectDB,
  type MongoRepositories,
} from '../src/lib/db.js';

const mongoTestUri = process.env.MONGO_TEST_URI;
const mongoSuite = mongoTestUri ? describe : describe.skip;
const testSecret = Buffer.alloc(32, 42).toString('base64url');
const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  PERSISTENCE_DRIVER: 'mongodb',
  MONGO_URI: mongoTestUri ?? 'mongodb://127.0.0.1/campfire_api_test',
  AUTH_ACCESS_TOKEN_SECRET: testSecret,
});

const authenticationSchema = z.object({
  data: z.object({
    user: z.object({ id: z.string(), username: z.string() }),
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});
const refreshSchema = z.object({
  data: z.object({ accessToken: z.string(), refreshToken: z.string() }),
});
const codeSchema = z.object({ code: z.string() });
const postIdSchema = z.object({ data: z.object({ id: z.string() }) });
const postStateSchema = z.object({
  data: z.object({ liked: z.boolean(), likesCount: z.number() }),
});
const userSessionSchema = z.object({
  data: z.object({
    user: z.object({ id: z.string(), username: z.string() }),
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});
const commentResponseSchema = z.object({
  data: z.object({ id: z.string(), text: z.string(), authorId: z.string() }),
});
const publicUserResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    displayName: z.string(),
    interests: z.array(z.string()),
    onboardingComplete: z.boolean(),
  }),
});
const postResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    authorId: z.string(),
    likesCount: z.number(),
    commentsCount: z.number(),
  }),
});
const postListSchema = z.object({
  data: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const commentsSchema = z.object({
  data: z.object({
    items: z.array(z.object({ text: z.string(), authorId: z.string() })),
  }),
});
const surgeStatusSchema = z.object({
  data: z.object({
    isActive: z.boolean(),
    startsAt: z.null(),
    endsAt: z.null(),
  }),
});

function localIsolatedUri(uri: string): string {
  const url = new URL(uri);
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'MONGO_TEST_URI must point to a local unauthenticated test MongoDB',
    );
  }
  url.pathname = `/campfire_api_test_${randomUUID().replaceAll('-', '')}`;
  return url.toString();
}

mongoSuite('MongoDB-backed API persistence', () => {
  let isolatedUri: string;
  let repositories: MongoRepositories;
  let app: ReturnType<typeof createApp>;

  async function openApplication(): Promise<void> {
    repositories = await connectDB(isolatedUri);
    app = createApp(
      config,
      {
        users: repositories.users,
        refreshSessions: repositories.refreshSessions,
      },
      repositories.surgeStatus,
      {
        posts: repositories.posts,
        readinessCheck: repositories.isReady,
      },
    );
  }

  beforeAll(async () => {
    if (!mongoTestUri)
      throw new Error('MONGO_TEST_URI is required for this suite');
    isolatedUri = localIsolatedUri(mongoTestUri);
    await openApplication();
  });

  afterAll(async () => {
    const database = mongoose.connection.db;
    if (database) await database.dropDatabase();
    await disconnectDB();
  });

  it('persists auth, profiles, posts, interactions, and Surge across reconnection', async () => {
    const email = `mongo-${randomUUID()}@example.test`;
    const signup = await request(app).post('/api/v1/auth/signup').send({
      displayName: 'Mongo Student',
      email,
      password: 'a sufficiently long password',
    });
    expect(signup.status).toBe(201);
    const created = authenticationSchema.parse(signup.body).data;

    const duplicateSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        displayName: 'Duplicate Student',
        email: email.toUpperCase(),
        password: 'a sufficiently long password',
      });
    expect(duplicateSignup.status).toBe(409);
    expect(codeSchema.parse(duplicateSignup.body).code).toBe('EMAIL_IN_USE');

    const sameUsername = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        displayName: 'Username Collision',
        email: email.replace('@example.test', '@other.example.test'),
        password: 'a sufficiently long password',
      });
    expect(sameUsername.status).toBe(201);
    expect(
      userSessionSchema.parse(sameUsername.body).data.user.username,
    ).not.toBe(created.user.username);

    const onboarding = await request(app)
      .post('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${created.accessToken}`)
      .send({ interests: ['music', 'sports'] });
    expect(onboarding.status).toBe(200);

    const profileUpdate = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${created.accessToken}`)
      .send({ displayName: 'Persistent Student' });
    expect(profileUpdate.status).toBe(200);

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${created.accessToken}`)
      .send({ text: 'This post must survive a server restart.' });
    expect(postResponse.status).toBe(201);
    const postId = postIdSchema.parse(postResponse.body).data.id;

    expect(
      (
        await request(app)
          .post(`/api/v1/posts/${postId}/likes`)
          .set('Authorization', `Bearer ${created.accessToken}`)
      ).status,
    ).toBe(200);
    const duplicateLike = await request(app)
      .post(`/api/v1/posts/${postId}/likes`)
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(postStateSchema.parse(duplicateLike.body).data).toMatchObject({
      liked: true,
      likesCount: 1,
    });
    const comment = await request(app)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${created.accessToken}`)
      .send({ text: 'Persistent comment' });
    expect(comment.status).toBe(201);
    const createdComment = commentResponseSchema.parse(comment.body).data;
    expect(createdComment.authorId).toBe(created.user.id);

    const otherSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        displayName: 'Other Student',
        email: `other-${randomUUID()}@example.test`,
        password: 'a sufficiently long password',
      });
    expect(otherSignup.status).toBe(201);
    const otherToken = authenticationSchema.parse(otherSignup.body).data
      .accessToken;

    await disconnectDB();
    await openApplication();

    const restoredSession = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(restoredSession.status).toBe(200);
    const restoredUser = publicUserResponseSchema.parse(
      restoredSession.body,
    ).data;
    expect(restoredUser).toMatchObject({
      id: created.user.id,
      displayName: 'Persistent Student',
      interests: ['music', 'sports'],
      onboardingComplete: true,
    });
    expect(JSON.stringify(restoredSession.body)).not.toContain('passwordHash');

    const post = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(post.status).toBe(200);
    expect(postResponseSchema.parse(post.body).data).toMatchObject({
      id: postId,
      authorId: created.user.id,
      likesCount: 1,
      commentsCount: 1,
    });
    const postList = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(
      postListSchema.parse(postList.body).data.items.map((item) => item.id),
    ).toContain(postId);
    const comments = await request(app)
      .get(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(commentsSchema.parse(comments.body).data.items).toMatchObject([
      { text: 'Persistent comment', authorId: created.user.id },
    ]);
    const unauthorizedCommentDelete = await request(app)
      .delete(`/api/v1/posts/${postId}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(unauthorizedCommentDelete.status).toBe(403);
    const commentDelete = await request(app)
      .delete(`/api/v1/posts/${postId}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${created.accessToken}`);
    expect(commentDelete.status).toBe(204);
    const surge = await request(app).get('/api/v1/surge/status');
    expect(surgeStatusSchema.parse(surge.body).data).toEqual({
      isActive: false,
      startsAt: null,
      endsAt: null,
    });

    const rotated = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: created.refreshToken });
    expect(rotated.status).toBe(200);
    const rotatedSession = refreshSchema.parse(rotated.body).data;
    expect(rotatedSession.refreshToken).not.toBe(created.refreshToken);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: created.refreshToken })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: rotatedSession.refreshToken })
      ).status,
    ).toBe(401);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'a sufficiently long password' });
    expect(login.status).toBe(200);
    const activeSession = authenticationSchema.parse(login.body).data;
    const concurrentRefreshes = await Promise.all([
      request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: activeSession.refreshToken }),
      request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: activeSession.refreshToken }),
    ]);
    expect(
      concurrentRefreshes.map((response) => response.status).sort(),
    ).toEqual([200, 401]);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/logout')
          .send({ refreshToken: activeSession.refreshToken })
      ).status,
    ).toBe(204);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: activeSession.refreshToken })
      ).status,
    ).toBe(401);
  });
});
