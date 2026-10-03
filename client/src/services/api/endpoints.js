// PROVISIONAL: paths and versioning are owned by the backend team.
// Only Node.js endpoints belong here. Never FastAPI paths.
export const ENDPOINTS = Object.freeze({
  health: '/health',
  auth: Object.freeze({
    session: '/auth/session',
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    onboarding: '/auth/onboarding',
  }),
  surge: Object.freeze({
    status: '/surge/status',
  }),
});