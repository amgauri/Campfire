import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

const unwrap = (raw) => raw?.data ?? raw;

export async function login({ email, password }, options) {
  return unwrap(await http.post(ENDPOINTS.auth.login, { email, password }, { ...options, skipAuth: true }));
}

export async function signup({ displayName, email, password }, options) {
  return unwrap(
    await http.post(ENDPOINTS.auth.signup, { displayName, email, password }, { ...options, skipAuth: true })
  );
}

export async function getSession(options) {
  return unwrap(await http.get(ENDPOINTS.auth.session, options));
}

export async function refresh(refreshToken, options) {
  return unwrap(await http.post(ENDPOINTS.auth.refresh, { refreshToken }, { ...options, skipAuth: true }));
}

export async function completeOnboarding({ interests }, options) {
  return unwrap(await http.post(ENDPOINTS.auth.onboarding, { interests }, options));
}

export async function logout(refreshToken, options) {
  await http.post(ENDPOINTS.auth.logout, { refreshToken }, { ...options, skipAuth: true });
}