import { z } from 'zod';
import { cursorQuerySchema } from './validation.js';

export const emptyBodySchema = z.strictObject({});

export const createCommentSchema = z.strictObject({
  text: z.string().trim().min(1).max(1000),
});

export const commentIdSchema = z.uuid();

export const listCommentsQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: cursorQuerySchema,
});

export type CreateCommentInput = z.output<typeof createCommentSchema>;
export type ListCommentsInput = z.output<typeof listCommentsQuerySchema>;
