import { useState } from 'react';
import { ScrollView } from 'react-native';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Screen from '@/components/common/Screen';
import TextField from '@/components/common/TextField';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/state/stores/authStore';
import { getErrorCopy } from '@/utils/errorCopy';

export default function SignupScreen() {
  const { spacing } = useTheme();
  const signup = useAuthStore((state) => state.signup);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signup({ displayName, email, password }); // phase becomes needsOnboarding; guards take over
    } catch (e) {
      setError(getErrorCopy(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  const ready = displayName.trim() && email.trim() && password.length >= 12;

  return (
    <Screen>
      <ScreenHeader title="Create account" />
      <ScrollView
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
        <TextField
          label="Campus email"
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
          helperText="At least 12 characters."
          error={error}
        />
        <Button title="Sign up" onPress={onSubmit} loading={submitting} disabled={!ready} fullWidth />
        <AppText variant="caption" tone="muted" align="center">
          Email verification and campus checks come from the backend later.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
