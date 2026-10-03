import { create } from 'zustand';

/**
 * Client-side UI mode. In later stages this will be driven by Surge status
 * reported by the server. The client must not decide it from the clock.
 */
export const useAppModeStore = create((set) => ({
  /** @type {import('@/types/common').AppMode} */
  mode: 'day',
  setMode: (mode) => set({ mode }),
}));