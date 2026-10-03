import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/state/queryClient';
import { useAppModeStore } from '@/state/stores/appModeStore';

export default function RootLayout() {
  const mode = useAppModeStore((state) => state.mode);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={mode === 'night' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}