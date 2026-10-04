// PROVISIONAL: paths and versioning are owned by the backend team.
// Only Node.js endpoints belong here. Never FastAPI paths.
export const ENDPOINTS = Object.freeze({
  health: '/health/live ',
  auth: Object.freeze({
    login: '/auth/login',
    signup: '/auth/signup',
    session: '/auth/session',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    onboarding: '/auth/onboarding',
  }),
  surge: Object.freeze({
    status: '/surge/status',
  }),
});