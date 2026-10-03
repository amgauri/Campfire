import { useAuthStore, selectAuthPhase } from '@/state/stores/authStore';

export const useAuthPhase = () => useAuthStore(selectAuthPhase);
export const useCurrentUser = () => useAuthStore((state) => state.user);