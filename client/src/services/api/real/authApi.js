import { ENDPOINTS } from '../endpoints';
import {
  http,
  setAuthRefreshHandler,
  setRefreshedAccessToken,
} from '../httpClient';
import {
  deleteRefreshToken,
  getRefreshToken,
  setRefreshToken,
} from './tokenStorage';

async function rotateStoredRefreshToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await http.post(
      ENDPOINTS.auth.refresh,
      { refreshToken },
      { skipAuthRefresh: true },
    );
    await setRefreshToken(response.data.refreshToken);
    return response.data;
  } catch (error) {
    if (error?.status === 401) {
      await deleteRefreshToken();
      setRefreshedAccessToken(null);
      return null;
    }
    throw error;
  }
}

setAuthRefreshHandler(async () => {
  const session = await rotateStoredRefreshToken();
  return session?.accessToken ?? null;
});

async function toAuthSession(response) {
  const session = response.data;
  await setRefreshToken(session.refreshToken);
  setRefreshedAccessToken(null);
  return {
    user: session.user,
    token: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

export async function restoreSession() {
  const tokens = await rotateStoredRefreshToken();
  if (!tokens) return null;
  const { accessToken } = tokens;
  try {
    const response = await http.get(ENDPOINTS.auth.session, {
      headers: { Authorization: `Bearer ${accessToken}` },
      skipAuthRefresh: true,
    });
    setRefreshedAccessToken(accessToken);
    return {
      user: response.data,
      token: accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    setRefreshedAccessToken(null);
    if (error?.status === 401) {
      await deleteRefreshToken();
      return null;
    }
    throw error;
  }
}

export async function login(credentials, options) {
  return toAuthSession(await http.post(ENDPOINTS.auth.login, credentials, options));
}

export async function signup(payload, options) {
  return toAuthSession(await http.post(ENDPOINTS.auth.signup, payload, options));
}

export async function logout(options) {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await http.post(
        ENDPOINTS.auth.logout,
        { refreshToken },
        { ...options, skipAuthRefresh: true },
      );
    }
  } finally {
    await deleteRefreshToken();
    setRefreshedAccessToken(null);
  }
}

export async function completeOnboarding(payload, options) {
  const response = await http.post(
    ENDPOINTS.auth.onboarding,
    payload,
    options,
  );
  return response.data;
}
