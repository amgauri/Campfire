import { useQuery } from '@tanstack/react-query';
import { useAuthPhase } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { queryKeys } from '@/state/queryKeys';

/**
 * Server-owned Surge status. The client never decides this from the clock.
 * Polling is a stopgap; when realtime exists, push updates with
 * queryClient.setQueryData(queryKeys.surgeStatus, payload).
 */
export function useSurgeStatus() {
  const phase = useAuthPhase();

  return useQuery({
    queryKey: queryKeys.surgeStatus,
    queryFn: ({ signal }) => api.surge.getStatus({ signal }),
    enabled: phase === 'signedIn',
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });
}