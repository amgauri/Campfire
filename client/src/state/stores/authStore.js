import { create } from 'zustand';
import { api } from '@/services/api';
import { setAuthTokenProvider } from '@/services/api/httpClient';
import { queryClient } from '@/state/queryClient';
import { logger } from '@/utils/logger';

/**
 * Access tokens stay in memory; the real API adapter persists refresh tokens
 * with platform secure storage and restores sessions through token rotation.
 */
export const useAuthStore = create((set, get) => ({
  hydrated: false,
  /** @type {import('@/types/common').User | null} */
  user: null,
  /** @type {string | null} */
  token: null,

  bootstrap: async () => {
    if (get().hydrated) return;
    try {
      const session = await api.auth.restoreSession();
      set({ user: session?.user ?? null, token: session?.token ?? null, hydrated: true });
    } catch (error) {
      logger.warn('Session restore failed', error);
      set({ user: null, token: null, hydrated: true });
    }
  },

  login: async (credentials) => {
    const session = await api.auth.login(credentials);
    set({ user: session.user, token: session.token });
  },

  signup: async (payload) => {
    const session = await api.auth.signup(payload);
    set({ user: session.user, token: session.token });
  },

  completeOnboarding: async (payload) => {
    const user = await api.auth.completeOnboarding(payload);
    set({ user });
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      logger.warn('Logout request failed', error);
    } finally {
      set({ user: null, token: null });
      queryClient.clear(); // the next user must never see this user's cached data
    }
  },
}));

// Every API request reads the token through this hook (see httpClient).
setAuthTokenProvider(() => useAuthStore.getState().token);

/** @returns {import('@/types/common').AuthPhase} */
export const selectAuthPhase = (state) => {
  if (!state.hydrated) return 'loading';
  if (!state.user) return 'signedOut';
  return state.user.onboardingComplete ? 'signedIn' : 'needsOnboarding';
};
