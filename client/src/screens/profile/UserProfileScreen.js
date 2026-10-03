import { useLocalSearchParams, useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="User"
      note="Another user's public profile."
      params={{ userId }}
      actions={[{ label: 'View posts', icon: 'image', onPress: () => router.push(ROUTES.userPosts(userId)) }]}
    />
  );
}