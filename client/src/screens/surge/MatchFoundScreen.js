import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Avatar from '@/components/common/Avatar';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';

/** Full-screen interrupting modal. No back or close icon: the user must choose. */
export default function MatchFoundScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { matchId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="It's a match"
      leading="none"
      note="Your match is anonymous until someone chooses to unblur."
      params={{ matchId }}
      actions={[
        { label: 'Start Ghost DM', icon: 'messages', variant: 'primary', onPress: () => router.push(ROUTES.ghostDm(matchId)) },
        { label: 'Blurred video call', icon: 'video', variant: 'surge', onPress: () => router.push(ROUTES.matchVideo(matchId)) },
        { label: 'Skip', variant: 'ghost', onPress: () => router.dismissAll() },
      ]}
    >
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Avatar anonymous size="xl" />
      </View>
    </PlaceholderScreen>
  );
}