import { useLocalSearchParams } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';

/** Presented as a route modal (see app/(app)/_layout.js). Close, not back. */
export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Comments"
      leading="close"
      note="Comment list and composer go here. Swipe down (iOS) or press back (Android) to dismiss."
      params={{ postId }}
    />
  );
}