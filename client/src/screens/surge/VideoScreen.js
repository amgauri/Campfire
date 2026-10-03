import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { useTheme } from '@/hooks/useTheme';

export default function VideoScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { matchId } = useLocalSearchParams();
  const [blurred, setBlurred] = useState(true);

  return (
    <PlaceholderScreen
      title="Video"
      note="No video provider is chosen yet. This is only the screen shell."
      params={{ matchId, blurred }}
      actions={[
        {
          label: blurred ? 'Unblur my video' : 'Blur my video again',
          icon: blurred ? 'reveal' : 'hide',
          variant: 'surge',
          onPress: () => setBlurred((value) => !value),
        },
        { label: 'End call', icon: 'close', variant: 'danger', onPress: () => router.dismissAll() },
      ]}
    >
      <View
        style={{
          aspectRatio: 9 / 16,
          maxHeight: 320,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        }}
      >
        <Icon name="video" size="xl" tone="muted" />
        <AppText variant="caption" tone="muted">
          Video renders here ({blurred ? 'blurred' : 'clear'})
        </AppText>
      </View>
    </PlaceholderScreen>
  );
}