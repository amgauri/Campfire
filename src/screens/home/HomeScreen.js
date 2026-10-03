import { View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Screen from '@/components/common/Screen';
import { ROUTES } from '@/constants/routes';
import { env } from '@/config/env';
import { useHealth } from '@/hooks/useHealth';
import { useTheme } from '@/hooks/useTheme';
import { useAppModeStore } from '@/state/stores/appModeStore';

export default function HomeScreen() {
  const router = useRouter();
  const { spacing, mode } = useTheme();
  const setMode = useAppModeStore((state) => state.setMode);
  const { data, isLoading, isError, error, refetch } = useHealth();

  let healthText = 'Checking API...';
  if (isError) healthText = `API error: ${error?.code ?? 'UNKNOWN'}`;
  else if (!isLoading && data) healthText = `API: ${data.status} (${data.service})`;

  return (
    <Screen style={{ justifyContent: 'center', gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="display">Campfire</AppText>
        <AppText tone="muted">Stage 0.2: design system</AppText>
      </View>

      <Card>
        <AppText variant="caption">Environment: {env.appEnv}</AppText>
        <AppText variant="caption">Mocks: {env.useMocks ? 'on' : 'off'}</AppText>
        <AppText variant="caption">Base URL: {env.apiBaseUrl}</AppText>
        <AppText variant="caption" tone={isError ? 'danger' : 'default'}>
          {healthText}
        </AppText>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Button
          title={`Preview ${mode === 'day' ? 'Night' : 'Day'}`}
          variant={mode === 'day' ? 'surge' : 'primary'}
          leftIcon={mode === 'day' ? 'night' : 'day'}
          onPress={() => setMode(mode === 'day' ? 'night' : 'day')}
        />
        <Button title="Recheck API" variant="secondary" leftIcon="refresh" onPress={() => refetch()} />
        {!env.isProduction ? (
          <Button
            title="Open design system"
            variant="ghost"
            rightIcon="forward"
            onPress={() => router.push(ROUTES.designSystem)}
          />
        ) : null}
      </View>
    </Screen>
  );
}