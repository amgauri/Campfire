import { useLocalSearchParams, useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';

export default function GhostDmScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Ghost DM"
      note="Anonymous chat for this match. Messages arrive over realtime later."
      params={{ matchId }}
      actions={[
        { label: 'Switch to video', icon: 'video', variant: 'surge', onPress: () => router.replace(ROUTES.matchVideo(matchId)) },
      ]}
    />
  );
}