import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Screen from '@/components/common/Screen';
import TextField from '@/components/common/TextField';
import { env } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/state/stores/authStore';
import { getErrorCopy } from '@/utils/errorCopy';

export default function LoginScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password }); // navigation reacts to the auth phase; no redirect here
    } catch (e) {
      setError(e?.code === 'INVALID_CREDENTIALS' ? 'Email or password is incorrect.' : getErrorCopy(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: spacing.lg, paddingVertical: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ gap: spacing.xs }}>
          <AppText variant="display">Campfire</AppText>
          <AppText tone="muted">Sign in with your campus account.</AppText>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@campus.edu"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          error={error}
        />

        <Button title="Log in" onPress={onSubmit} loading={submitting} disabled={!email || !password} fullWidth />
        <Button title="Create an account" variant="ghost" onPress={() => router.push(ROUTES.signup)} />

        {env.useMocks ? (
          <AppText variant="caption" tone="muted" align="center">
            Mock mode: any email and a 12+ character password works.
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
