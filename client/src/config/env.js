// Expo only inlines EXPO_PUBLIC_* variables when referenced as
// `process.env.EXPO_PUBLIC_NAME` (static access). Do not destructure or use dynamic keys.

const APP_ENVS = ['development', 'staging', 'production'];

const rawAppEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const appEnv = APP_ENVS.includes(rawAppEnv) ? rawAppEnv : 'development';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = normalizedBaseUrl.endsWith('/api/v1')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;
const timeout = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS);

export const env = Object.freeze({
  appEnv,
  isProduction: appEnv === 'production',
  // Node.js API only. The FastAPI service must never be configured here.
  apiBaseUrl,
  // Mocks can never be enabled in production builds.
  useMocks: appEnv !== 'production' && process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 10000,
});
