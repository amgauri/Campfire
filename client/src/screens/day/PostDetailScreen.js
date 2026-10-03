import { useLocalSearchParams, useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Post"
      note="Single post view."
      params={{ postId }}
      actions={[
        { label: 'Open comments', icon: 'comment', onPress: () => router.push(ROUTES.comments(postId)) },
        { label: 'View author', icon: 'people', onPress: () => router.push(ROUTES.user('u_demo')) },
      ]}
    />
  );
}