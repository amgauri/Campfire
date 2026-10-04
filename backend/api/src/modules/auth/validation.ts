import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const registerSchema = z.strictObject({
  email,
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1),
});

export const refreshTokenSchema = z.strictObject({
  refreshToken: z.string().min(1),
});

export const onboardingSchema = z.strictObject({
  interests: z.array(z.string().trim().min(1).max(40)).max(10),
});

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;
export type OnboardingInput = z.output<typeof onboardingSchema>;
