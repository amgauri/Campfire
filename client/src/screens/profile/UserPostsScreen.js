import { useLocalSearchParams, useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';

export default function UserPostsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Posts"
      note="A user's post grid or list."
      params={{ userId }}
      actions={[{ label: 'Open a post', icon: 'image', onPress: () => router.push(ROUTES.post('demo-post')) }]}
    />
  );
}