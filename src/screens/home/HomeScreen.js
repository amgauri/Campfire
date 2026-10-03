import { Pressable, StyleSheet, View } from 'react-native';

import AppText from '@/components/common/AppText';
import Screen from '@/components/common/Screen';
import { env } from '@/config/env';
import { useHealth } from '@/hooks/useHealth';
import { useTheme } from '@/hooks/useTheme';
import { useAppModeStore } from '@/state/stores/appModeStore';

export default function HomeScreen() {
  const { colors, spacing, radius, mode } = useTheme();
  const setMode = useAppModeStore((state) => state.setMode);
  const { data, isLoading, isError, error, refetch } = useHealth();

  let healthText = 'Checking API...';
  if (isError) healthText = `API error: ${error?.code ?? 'UNKNOWN'}`;
  else if (!isLoading && data) healthText = `API: ${data.status} (${data.service})`;

  return (
    <Screen style={styles.center}>
      <AppText variant="title">Campfire</AppText>
      <AppText muted style={{ marginTop: spacing.sm }}>
        Stage 0.1: architecture scaffold
      </AppText>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            marginTop: spacing.lg,
            padding: spacing.md,
          },
        ]}
      >
        <AppText variant="caption">Environment: {env.appEnv}</AppText>
        <AppText variant="caption">Mocks: {env.useMocks ? 'on' : 'off'}</AppText>
        <AppText variant="caption">Base URL: {env.apiBaseUrl}</AppText>
        <AppText variant="caption">{healthText}</AppText>
      </View>

      <View style={[styles.row, { marginTop: spacing.lg, gap: spacing.sm }]}>
        <Pressable
          onPress={() => setMode(mode === 'day' ? 'night' : 'day')}
          style={[styles.button, { backgroundColor: colors.accent, borderRadius: radius.md }]}
        >
          <AppText style={styles.buttonText}>Preview {mode === 'day' ? 'Night' : 'Day'}</AppText>
        </Pressable>

        <Pressable
          onPress={() => refetch()}
          style={[styles.button, { borderColor: colors.border, borderWidth: 1, borderRadius: radius.md }]}
        >
          <AppText>Recheck API</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, alignSelf: 'stretch' },
  row: { flexDirection: 'row' },
  button: { paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});