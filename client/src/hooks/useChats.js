import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useAuth';
import { listChats, listMessages, sendMessage } from '@/services/api/chatApi';
import { queryKeys } from '@/state/queryKeys';

export function useChats() {
  return useQuery({ queryKey: queryKeys.chats, queryFn: ({ signal }) => listChats({ signal }) });
}

// Polling stands in for realtime until the socket layer exists.
export function useMessages(chatId) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.messages(chatId),
    queryFn: ({ signal }) => listMessages({ chatId, meId: user?.id }, { signal }),
    enabled: Boolean(chatId),
    refetchInterval: 4000,
  });
}

export function useSendMessage(chatId) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: (text) => sendMessage({ chatId, text, meId: user?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
  });
}