import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashView from '@/components/shell/SplashView';
import { useAuthPhase } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import ModeSync from '@/navigation/ModeSync';
import { queryClient } from '@/state/queryClient';
import { useAuthStore } from '@/state/stores/authStore';

// Keep the native splash up until our in-app SplashView takes over.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const phase = useAuthPhase();
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* While loading, (auth) is the mounted group and SplashView covers it. */}
      <Stack.Protected guard={phase === 'loading' || phase === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={phase === 'needsOnboarding'}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={phase === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const { mode } = useTheme();
  const phase = useAuthPhase();
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={mode === 'night' ? 'light' : 'dark'} />
        <ModeSync />
        <RootNavigator />
        {phase === 'loading' ? <SplashView /> : null}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}