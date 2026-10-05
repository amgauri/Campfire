// Paths are relative to the configured Node API base URL, which includes /api/v1.
export const ENDPOINTS = Object.freeze({
  health: '/health/live',
  auth: Object.freeze({
    session: '/auth/session',
    refresh: '/auth/refresh',
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    onboarding: '/auth/onboarding',
  }),
  surge: Object.freeze({
    status: '/surge/status',
  }),
});
