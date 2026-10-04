import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Icon from '@/components/common/Icon';
import { ROUTES } from '@/constants/routes';
import { useSurgeStatus } from '@/hooks/useSurgeStatus';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { data } = useSurgeStatus();
  const live = data?.isActive === true;

  const tabIcon = (name, activeName) =>
    function TabIcon({ focused, color }) {
      return <Icon name={focused ? activeName : name} size="md" color={color} />;
    };

  const CreateIcon = () => (
    <View
      style={{
        width: 46,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="add" size="md" color={colors.textOnAccent} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.textAccent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.backgroundElevated, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: typography.label.fontWeight },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Day', tabBarIcon: tabIcon('home', 'homeActive') }} />
      <Tabs.Screen
        name="surge"
        options={{
          title: 'Surge',
          tabBarIcon: tabIcon('surge', 'surgeActive'),
          tabBarBadge: live ? 'LIVE' : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.textOnAccent },
          tabBarAccessibilityLabel: live ? 'Surge, live now' : 'Surge',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Post', tabBarIcon: CreateIcon, tabBarAccessibilityLabel: 'Create post' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // never shows a "create" tab screen; opens the modal instead
            router.push(ROUTES.createPost);
          },
        }}
      />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: tabIcon('messages', 'messagesActive') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('profile', 'profileActive') }} />
    </Tabs>
  );
}