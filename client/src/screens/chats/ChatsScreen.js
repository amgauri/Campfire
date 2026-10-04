import { useState } from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Screen from '@/components/common/Screen';
import Spinner from '@/components/common/Spinner';
import ChatRow from '@/components/chat/ChatRow';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { ROUTES } from '@/constants/routes';
import { useChats } from '@/hooks/useChats';

export default function ChatsScreen() {
  const router = useRouter();
  const { data: chats, isLoading, isError, error, refetch } = useChats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  let body;
  if (isLoading) {
    body = <Spinner centered label="Loading chats..." />;
  } else if (isError) {
    body = <ErrorState error={error} onRetry={() => refetch()} style={{ flex: 1 }} />;
  } else {
    body = (
      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState icon="messages" title="No chats yet" message="Messages with friends show up here." />
        }
        renderItem={({ item }) => <ChatRow chat={item} onPress={() => router.push(ROUTES.chat(item.id))} />}
      />
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Chats" large leading="none" />
      {body}
    </Screen>
  );
}