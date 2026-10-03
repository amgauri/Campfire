import { View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Screen from '@/components/common/Screen';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const user = useCurrentUser();

  return (
    <Screen>
      <ScreenHeader
        title="Profile"
        large
        leading="none"
        trailing={[{ icon: 'settings', label: 'Settings', onPress: () => router.push(ROUTES.settings) }]}
      />

      <View style={{ alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl }}>
        <Avatar name={user?.displayName} uri={user?.avatarUrl ?? undefined} size="xl" auraLevel={user?.auraLevel ?? 0} />
        <AppText variant="title">{user?.displayName}</AppText>
        <AppText tone="muted">@{user?.username}</AppText>
      </View>

      <Button
        title="My posts"
        variant="secondary"
        leftIcon="image"
        onPress={() => user && router.push(ROUTES.userPosts(user.id))}
      />
    </Screen>
  );
}