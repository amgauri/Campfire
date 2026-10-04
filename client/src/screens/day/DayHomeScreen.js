import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Screen from '@/components/common/Screen';
import Spinner from '@/components/common/Spinner';
import PostCard from '@/components/feed/PostCard';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { ROUTES } from '@/constants/routes';
import { useFeed, useToggleLike, useToggleSave } from '@/hooks/useFeed';
import { useTheme } from '@/hooks/useTheme';

export default function DayHomeScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { data: posts, isLoading, isError, error, refetch } = useFeed();
  const like = useToggleLike();
  const save = useToggleSave();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  let body;
  if (isLoading) {
    body = <Spinner centered label="Loading feed..." />;
  } else if (isError) {
    body = <ErrorState error={error} onRetry={() => refetch()} style={{ flex: 1 }} />;
  } else {
    body = (
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.lg }} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No posts yet"
            message="Be the first to post something for campus."
            actionLabel="Create post"
            onAction={() => router.push(ROUTES.createPost)}
          />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={() => like.mutate({ postId: item.id, value: !item.liked })}
            onToggleSave={() => save.mutate({ postId: item.id, value: !item.saved })}
            onOpenComments={() => router.push(ROUTES.comments(item.id))}
            onOpenAuthor={() => router.push(ROUTES.user(item.author.id))}
          />
        )}
      />
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Day"
        large
        leading="none"
        trailing={[
          { icon: 'notifications', label: 'Notifications', onPress: () => router.push(ROUTES.notifications) },
          { icon: 'settings', label: 'Settings', onPress: () => router.push(ROUTES.settings) },
        ]}
      />
      {body}
    </Screen>
  );
}