import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { queryKeys } from '@/state/queryKeys';

/** Dev-only: flip the MOCK server's Surge status to test navigation guards. */
export function useDevSurgeControls() {
  const queryClient = useQueryClient();
  const available = !env.isProduction && typeof api.surge._devSetActive === 'function';

  const setActive = async (value) => {
    api.surge._devSetActive(value);
    await queryClient.invalidateQueries({ queryKey: queryKeys.surgeStatus });
  };

  return { available, setActive };
}