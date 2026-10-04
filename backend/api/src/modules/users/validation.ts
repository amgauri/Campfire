import { z } from 'zod';
import { displayNameSchema } from '../auth/validation.js';

export const updateProfileSchema = z.strictObject({
  displayName: displayNameSchema,
});

export const userIdSchema = z.uuid();

export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
