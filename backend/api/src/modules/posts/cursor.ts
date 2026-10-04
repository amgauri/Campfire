import { z } from 'zod';
import type { PostCursor } from './domain.js';

const cursorSchema = z.strictObject({
  createdAt: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString() === value;
  }),
  id: z.uuid(),
});

export function encodeCursor(cursor: PostCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt, id: cursor.id }),
  ).toString('base64url');
}

export function decodeCursor(value: string): PostCursor | null {
  if (
    value.length > 512 ||
    !/^[A-Za-z0-9_-]+$/.test(value) ||
    Buffer.from(value, 'base64url').toString('base64url') !== value
  ) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    const result = cursorSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
