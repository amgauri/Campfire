import { useRouter } from 'expo-router';
import EmptyState from '@/components/common/EmptyState';
import Screen from '@/components/common/Screen';
import { ROUTES } from '@/constants/routes';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen style={{ justifyContent: 'center' }}>
      <EmptyState
        icon="error"
        title="Page not found"
        message="That link doesn't lead anywhere in Campfire."
        actionLabel="Go home"
        onAction={() => router.replace(ROUTES.home)}
      />
    </Screen>
  );
}