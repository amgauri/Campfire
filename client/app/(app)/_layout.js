import { Stack } from 'expo-router';
import { useSurgeStatus } from '@/hooks/useSurgeStatus';
import { useTheme } from '@/hooks/useTheme';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  const { colors } = useTheme();
  const { data } = useSurgeStatus();
  const surgeActive = data?.isActive === true;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="create-post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="chat/[chatId]" />

      <Stack.Screen name="post/[postId]/index" />
      <Stack.Screen name="post/[postId]/comments" options={{ presentation: 'modal' }} />
      <Stack.Screen name="user/[userId]/index" />
      <Stack.Screen name="user/[userId]/posts" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="design-system" />

      <Stack.Protected guard={surgeActive}>
        <Stack.Screen name="(surge)/waiting" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen
          name="(surge)/match/[matchId]/index"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen name="(surge)/match/[matchId]/chat" />
        <Stack.Screen name="(surge)/match/[matchId]/video" />
        <Stack.Screen name="(surge)/stage/[stageId]" />
        <Stack.Screen name="(surge)/stage/host" />
      </Stack.Protected>
    </Stack>
  );
}