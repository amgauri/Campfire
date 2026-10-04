import { create } from 'zustand';
import { api } from '@/services/api';
import { ApiError, setAuthTokenProvider, setSessionHandlers } from '@/services/api/httpClient';
import { clearStoredTokens, getStoredTokens, storeTokens } from '@/services/storage/tokenStorage';
import { queryClient } from '@/state/queryClient';
import { logger } from '@/utils/logger';

export const useAuthStore = create((set, get) => {
  const applySession = async ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });
    await storeTokens({ accessToken, refreshToken });
  };

  const clearSession = async () => {
    set({ user: null, accessToken: null, refreshToken: null });
    queryClient.clear(); // the next user must never see this user's cached data
    await clearStoredTokens();
  };

  return {
    hydrated: false,
    user: null,
    accessToken: null,
    refreshToken: null,

    bootstrap: async () => {
      if (get().hydrated) return;
      try {
        const stored = await getStoredTokens();
        if (stored?.accessToken && stored?.refreshToken) {
          set({ accessToken: stored.accessToken, refreshToken: stored.refreshToken });
          const user = await api.auth.getSession(); // refreshes automatically if the token expired
          set({ user });
        }
      } catch (error) {
        logger.warn('Session restore failed', error);
        set({ user: null }); // tokens stay stored on network errors; cleared on real 401s
      } finally {
        set({ hydrated: true });
      }
    },

    login: async (credentials) => applySession(await api.auth.login(credentials)),
    signup: async (payload) => applySession(await api.auth.signup(payload)),

    completeOnboarding: async (payload) => {
      set({ user: await api.auth.completeOnboarding(payload) });
    },

    logout: async () => {
      try {
        await api.auth.logout(get().refreshToken);
      } catch (error) {
        logger.warn('Logout request failed', error);
      } finally {
        await clearSession();
      }
    },

    /** Used by httpClient: swap the refresh token, return the new access token (or null if dead). */
    refreshTokens: async () => {
      const current = get().refreshToken;
      if (!current) return null;
      try {
        const t = await api.auth.refresh(current);
        set({ accessToken: t.accessToken, refreshToken: t.refreshToken });
        await storeTokens({ accessToken: t.accessToken, refreshToken: t.refreshToken });
        return t.accessToken;
      } catch (error) {
        if (error instanceof ApiError && [400, 401].includes(error.status)) return null;
        throw error;
      }
    },

    expireSession: () => clearSession(),
  };
});

setAuthTokenProvider(() => useAuthStore.getState().accessToken);
setSessionHandlers({
  refresh: () => useAuthStore.getState().refreshTokens(),
  onExpired: () => useAuthStore.getState().expireSession(),
});

export const selectAuthPhase = (state) => {
  if (!state.hydrated) return 'loading';
  if (!state.user) return 'signedOut';
  return state.user.onboardingComplete ? 'signedIn' : 'needsOnboarding';
};