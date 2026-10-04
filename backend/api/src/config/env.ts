import { z } from 'zod';

const originSchema = z.string().refine((origin) => {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin === origin
    );
  } catch {
    return false;
  }
}, 'Expected an HTTP or HTTPS origin without a path');

const signingKeySchema = z.string().refine((value) => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const bytes = Buffer.from(value, 'base64url');
  return bytes.length === 32 && bytes.toString('base64url') === value;
}, 'Expected 32 random bytes encoded as base64url');

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(originSchema)),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),
  AUTH_ACCESS_TOKEN_SECRET: signingKeySchema,
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(3600)
    .default(900),
  AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(90)
    .default(30),
  FASTAPI_BASE_URL: z.union([originSchema, z.literal('')]).default(''),
  FASTAPI_TIMEOUT_MS: z.coerce.number().int().min(100).max(10000).default(3000),
});

export type AppConfig = {
  nodeEnv: z.output<typeof envSchema>['NODE_ENV'];
  port: number;
  host: z.output<typeof envSchema>['HOST'];
  corsOrigins: string[];
  logLevel: z.output<typeof envSchema>['LOG_LEVEL'];
  authAccessTokenSecret: string;
  authAccessTokenTtlSeconds: number;
  authRefreshTokenTtlDays: number;
  fastApiBaseUrl: string | null;
  fastApiTimeoutMs: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(`Invalid environment configuration: ${fields.join(', ')}`);
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    host: result.data.HOST,
    corsOrigins: result.data.CORS_ORIGINS,
    logLevel: result.data.LOG_LEVEL,
    authAccessTokenSecret: result.data.AUTH_ACCESS_TOKEN_SECRET,
    authAccessTokenTtlSeconds: result.data.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    authRefreshTokenTtlDays: result.data.AUTH_REFRESH_TOKEN_TTL_DAYS,
    fastApiBaseUrl: result.data.FASTAPI_BASE_URL || null,
    fastApiTimeoutMs: result.data.FASTAPI_TIMEOUT_MS,
  };
}
