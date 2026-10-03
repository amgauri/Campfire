import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Dialog from '@/components/common/Dialog';
import Screen from '@/components/common/Screen';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { env } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { useDevSurgeControls } from '@/hooks/useDevSurgeControls';
import { useHealth } from '@/hooks/useHealth';
import { useSurgeStatus } from '@/hooks/useSurgeStatus';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/state/stores/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const { data: health, isLoading, isError, error, refetch } = useHealth();
  const { data: surge } = useSurgeStatus();
  const dev = useDevSurgeControls();
  const [confirmOpen, setConfirmOpen] = useState(false);

  let healthText = 'Checking API...';
  if (isError) healthText = `API error: ${error?.code ?? 'UNKNOWN'}`;
  else if (!isLoading && health) healthText = `API: ${health.status} (${health.service})`;

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <Button title="Log out" variant="danger" leftIcon="lock" onPress={() => setConfirmOpen(true)} />

        {!env.isProduction ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="overline" tone="muted">
              Developer tools
            </AppText>
            <Card style={{ gap: spacing.xs }}>
              <AppText variant="caption">Environment: {env.appEnv}</AppText>
              <AppText variant="caption">Mocks: {env.useMocks ? 'on' : 'off'}</AppText>
              <AppText variant="caption">Base URL: {env.apiBaseUrl}</AppText>
              <AppText variant="caption" tone={isError ? 'danger' : 'default'}>
                {healthText}
              </AppText>
              <AppText variant="caption">Surge live: {surge?.isActive ? 'yes' : 'no'}</AppText>
            </Card>

            <Button title="Recheck API" variant="secondary" leftIcon="refresh" onPress={() => refetch()} />
            {dev.available ? (
              <Button
                title={surge?.isActive ? 'Simulate: end Surge' : 'Simulate: start Surge'}
                variant="secondary"
                leftIcon="surge"
                onPress={() => dev.setActive(!surge?.isActive)}
              />
            ) : null}
            <Button
              title="Open design system"
              variant="ghost"
              rightIcon="forward"
              onPress={() => router.push(ROUTES.designSystem)}
            />
          </View>
        ) : null}
      </ScrollView>

      <Dialog
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Log out?"
        message="You'll need to sign in again."
        actions={[
          {
            label: 'Log out',
            variant: 'danger',
            onPress: () => {
              setConfirmOpen(false);
              logout(); // guards swap the whole app group for the auth group
            },
          },
          { label: 'Cancel', variant: 'ghost', onPress: () => setConfirmOpen(false) },
        ]}
      />
    </Screen>
  );
}