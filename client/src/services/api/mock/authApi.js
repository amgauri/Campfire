import { sleep } from '@/utils/sleep';
import { ApiError } from '../httpClient';

let currentUser = null;

const makeUser = (overrides) => ({
  id: 'u_me',
  username: 'campfire_fan',
  displayName: 'Campfire Fan',
  email: 'me@campus.edu',
  avatarUrl: null,
  auraLevel: 2,
  interests: [],
  onboardingComplete: false,
  ...overrides,
});

const invalid = () =>
  new ApiError('Invalid email or password', { status: 401, code: 'INVALID_CREDENTIALS' });

/** Mock has no persistence, so every app start is signed out. */
export async function restoreSession() {
  await sleep(700);
  return null;
}

export async function login({ email, password }) {
  await sleep(600);
  if (!email?.trim() || !password || password.length < 6) throw invalid();
  currentUser = makeUser({ email: email.trim().toLowerCase(), interests: ['Music'], onboardingComplete: true });
  return { user: currentUser, token: 'mock-token' };
}

export async function signup({ displayName, email, password }) {
  await sleep(700);
  if (!displayName?.trim() || !email?.trim() || !password || password.length < 6) {
    throw new ApiError('Check your details', { status: 400, code: 'VALIDATION_ERROR' });
  }
  currentUser = makeUser({
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    onboardingComplete: false,
  });
  return { user: currentUser, token: 'mock-token' };
}

export async function completeOnboarding({ interests }) {
  await sleep(500);
  currentUser = { ...currentUser, interests, onboardingComplete: true };
  return currentUser;
}

export async function logout() {
  await sleep(200);
  currentUser = null;
}