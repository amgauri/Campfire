import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import ErrorState from '@/components/common/ErrorState';
import Screen from '@/components/common/Screen';
import Spinner from '@/components/common/Spinner';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { ROUTES } from '@/constants/routes';
import { useSurgeStatus } from '@/hooks/useSurgeStatus';
import { useTheme } from '@/hooks/useTheme';

// Formatting a server-provided time is fine. Deciding whether Surge is on is not.
const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function SurgeLobbyScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useSurgeStatus();

  if (isLoading) {
    return (
      <Screen>
        <Spinner centered label="Checking Surge..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => refetch()} style={{ flex: 1 }} />
      </Screen>
    );
  }

  const live = data?.isActive === true;
  let detail = 'Check back soon.';
  if (live && data.endsAt) detail = `Ends around ${formatClock(data.endsAt)}.`;
  if (!live && data?.startsAt) detail = `Next Surge: ${formatClock(data.startsAt)}.`;

  return (
    <Screen>
      <ScreenHeader title="Surge" large leading="none" />
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <Card variant={live ? 'highlight' : 'flat'} style={{ gap: spacing.xs }}>
          <AppText variant="overline" tone={live ? 'accent' : 'muted'}>
            {live ? 'Live now' : 'Not live'}
          </AppText>
          <AppText variant="heading">{live ? 'The campus is up tonight' : 'Surge starts later tonight'}</AppText>
          <AppText tone="muted">{detail}</AppText>
        </Card>

        {live ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              title="Join the queue"
              variant="surge"
              size="lg"
              leftIcon="surge"
              onPress={() => router.push(ROUTES.waiting)}
            />
            <Button
              title="Watch the Live Stage"
              variant="secondary"
              leftIcon="video"
              onPress={() => router.push(ROUTES.stage('demo-stage'))}
            />
            <Button
              title="Host a Live Stage"
              variant="secondary"
              leftIcon="mic"
              onPress={() => router.push(ROUTES.stageHost)}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}