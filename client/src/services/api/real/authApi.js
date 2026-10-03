import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

// PROVISIONAL contract: every call below resolves to an AuthSession
// ({ user, token }) except logout. See src/types/common.js.

/** No token persistence yet, so there is nothing to restore. Replace when auth storage exists. */
export async function restoreSession() {
  return null;
}

export const login = (credentials, options) => http.post(ENDPOINTS.auth.login, credentials, options);
export const signup = (payload, options) => http.post(ENDPOINTS.auth.signup, payload, options);
export const logout = (options) => http.post(ENDPOINTS.auth.logout, undefined, options);
export const completeOnboarding = (payload, options) => http.post(ENDPOINTS.auth.onboarding, payload, options);