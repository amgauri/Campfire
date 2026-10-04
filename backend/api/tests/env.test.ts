import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env.js';

const testSecret = Buffer.alloc(32, 42).toString('base64url');

describe('environment configuration', () => {
  it('uses safe defaults and parses configured origins', () => {
    const config = loadConfig({
      CORS_ORIGINS: 'http://localhost:5173, https://campfire.example',
      AUTH_ACCESS_TOKEN_SECRET: testSecret,
    });

    expect(config).toEqual({
      nodeEnv: 'development',
      port: 3000,
      host: '127.0.0.1',
      corsOrigins: ['http://localhost:5173', 'https://campfire.example'],
      logLevel: 'info',
      authAccessTokenSecret: testSecret,
      authAccessTokenTtlSeconds: 900,
      authRefreshTokenTtlDays: 30,
      fastApiBaseUrl: null,
      fastApiTimeoutMs: 3000,
    });
  });

  it('rejects invalid values without echoing their contents', () => {
    expect(() =>
      loadConfig({
        PORT: 'not-a-port',
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
      }),
    ).toThrow('Invalid environment configuration: PORT');
    expect(() =>
      loadConfig({
        CORS_ORIGINS: 'javascript:secret',
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
      }),
    ).toThrow('Invalid environment configuration: CORS_ORIGINS');
    expect(() =>
      loadConfig({
        AUTH_ACCESS_TOKEN_SECRET: 'replace-with-a-long-random-secret',
      }),
    ).toThrow('Invalid environment configuration: AUTH_ACCESS_TOKEN_SECRET');
    expect(() =>
      loadConfig({
        HOST: 'example.com',
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
      }),
    ).toThrow('Invalid environment configuration: HOST');
    expect(() =>
      loadConfig({
        FASTAPI_BASE_URL: 'https://example.com/path',
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
      }),
    ).toThrow('Invalid environment configuration: FASTAPI_BASE_URL');
  });

  it('accepts LAN binding and bounded token lifetimes', () => {
    const config = loadConfig({
      HOST: '0.0.0.0',
      AUTH_ACCESS_TOKEN_SECRET: testSecret,
      AUTH_ACCESS_TOKEN_TTL_SECONDS: '600',
      AUTH_REFRESH_TOKEN_TTL_DAYS: '14',
    });
    expect(config.host).toBe('0.0.0.0');
    expect(config.authAccessTokenTtlSeconds).toBe(600);
    expect(config.authRefreshTokenTtlDays).toBe(14);
  });

  it('validates optional FastAPI origin and timeout without requiring the service', () => {
    const config = loadConfig({
      AUTH_ACCESS_TOKEN_SECRET: testSecret,
      FASTAPI_BASE_URL: 'http://127.0.0.1:8000',
      FASTAPI_TIMEOUT_MS: '2500',
    });
    expect(config.fastApiBaseUrl).toBe('http://127.0.0.1:8000');
    expect(config.fastApiTimeoutMs).toBe(2500);
    expect(() =>
      loadConfig({
        AUTH_ACCESS_TOKEN_SECRET: testSecret,
        FASTAPI_TIMEOUT_MS: '0',
      }),
    ).toThrow('Invalid environment configuration: FASTAPI_TIMEOUT_MS');
  });
});
