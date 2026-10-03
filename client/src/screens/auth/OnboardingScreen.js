import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import Screen from '@/components/common/Screen';
import { useCurrentUser } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/state/stores/authStore';
import { getErrorCopy } from '@/utils/errorCopy';

// PLACEHOLDER: the real interest list will come from the backend.
const INTERESTS = ['Music', 'Gaming', 'Memes', 'Sports', 'Anime', 'Fitness', 'Coding', 'Art', 'Food', 'Movies'];

export default function OnboardingScreen() {
  const { spacing } = useTheme();
  const user = useCurrentUser();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const [picked, setPicked] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (item) =>
    setPicked((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const onFinish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({ interests: picked }); // phase becomes signedIn; app group mounts
    } catch (e) {
      setError(getErrorCopy(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingVertical: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title" accessibilityRole="header">
            Welcome{user ? `, ${user.displayName}` : ''}
          </AppText>
          <AppText tone="muted">Pick a few interests so Campfire can find people you'll click with.</AppText>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {INTERESTS.map((item) => (
            <Chip key={item} label={item} selected={picked.includes(item)} onPress={() => toggle(item)} />
          ))}
        </View>

        {error ? (
          <AppText tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}

        <Button title="Finish" onPress={onFinish} loading={submitting} disabled={picked.length === 0} fullWidth />
      </ScrollView>
    </Screen>
  );
}