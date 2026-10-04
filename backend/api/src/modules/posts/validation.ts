import { z } from 'zod';
import { decodeCursor } from './cursor.js';

const mediaUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && url.username === '' && url.password === ''
    );
  }, 'Expected an HTTPS image URL without credentials');

export const createPostSchema = z.strictObject({
  text: z.string().trim().min(1).max(2000),
  mediaUrl: mediaUrlSchema.nullish(),
});

export const postIdSchema = z.uuid();

export const cursorQuerySchema = z
  .string()
  .transform((value, context) => {
    const cursor = decodeCursor(value);
    if (cursor) return cursor;
    context.addIssue({ code: 'custom', message: 'Invalid cursor' });
    return z.NEVER;
  })
  .optional();

export const listPostsQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  authorId: z.uuid().optional(),
  cursor: cursorQuerySchema,
});

export type CreatePostInput = z.output<typeof createPostSchema>;
export type ListPostsInput = z.output<typeof listPostsQuerySchema>;
