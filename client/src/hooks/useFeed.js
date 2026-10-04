import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useAuth';
import { createPost, listPosts, setLiked, setSaved } from '@/services/api/feedApi';
import { queryKeys } from '@/state/queryKeys';

export function useFeed() {
  return useQuery({ queryKey: queryKeys.feed, queryFn: ({ signal }) => listPosts({ signal }) });
}

// Optimistic toggle: update the cache now, roll back if the request fails.
function useOptimisticToggle(field, request) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onMutate: async ({ postId, value }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed });
      const previous = queryClient.getQueryData(queryKeys.feed);
      queryClient.setQueryData(queryKeys.feed, (old) =>
        old?.map((post) => {
          if (post.id !== postId) return post;
          const next = { ...post, [field]: value };
          if (field === 'liked') next.likesCount = Math.max(0, post.likesCount + (value ? 1 : -1));
          return next;
        })
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.feed, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
  });
}

export const useToggleLike = () =>
  useOptimisticToggle('liked', ({ postId, value }) => setLiked({ postId, liked: value }));

export const useToggleSave = () =>
  useOptimisticToggle('saved', ({ postId, value }) => setSaved({ postId, saved: value }));

export function useCreatePost() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: ({ caption, imageUri }) => createPost({ caption, imageUri, author: user }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
  });
}