import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import MessageBubble from '@/components/chat/MessageBubble';
import ErrorState from '@/components/common/ErrorState';
import IconButton from '@/components/common/IconButton';
import Screen from '@/components/common/Screen';
import Spinner from '@/components/common/Spinner';
import TextField from '@/components/common/TextField';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { useCurrentUser } from '@/hooks/useAuth';
import { useChats, useMessages, useSendMessage } from '@/hooks/useChats';
import { useTheme } from '@/hooks/useTheme';

export default function ChatThreadScreen() {
  const { chatId } = useLocalSearchParams();
  const { spacing } = useTheme();
  const me = useCurrentUser();
  const { data: chats } = useChats();
  const { data: messages = [], isLoading, isError, error, refetch } = useMessages(chatId);
  const send = useSendMessage(chatId);
  const [text, setText] = useState('');

  const title = chats?.find((chat) => chat.id === chatId)?.partner.displayName ?? 'Chat';

  const onSend = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    send.mutate(value, { onSuccess: () => refetch() });
  };

  let body;
  if (isLoading) {
    body = <Spinner centered label="Loading messages..." />;
  } else if (isError) {
    body = <ErrorState error={error} onRetry={() => refetch()} style={{ flex: 1 }} />;
  } else {
    body = (
      <FlatList
        inverted
        data={messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <MessageBubble text={item.text} mine={item.senderId === me?.id} />}
      />
    );
  }

  return (
    <Screen>
      <ScreenHeader title={title} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>{body}</View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
          <TextField
            style={{ flex: 1 }}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            returnKeyType="send"
            onSubmitEditing={onSend}
            maxLength={1000}
          />
          <IconButton
            icon="send"
            variant="filled"
            accessibilityLabel="Send message"
            disabled={!text.trim()}
            onPress={onSend}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}