import { Tabs } from 'expo-router';
import Icon from '@/components/common/Icon';
import { useSurgeStatus } from '@/hooks/useSurgeStatus';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  const { data } = useSurgeStatus();
  const live = data?.isActive === true;

  const tabIcon = (name, activeName) =>
    function TabIcon({ focused, color }) {
      return <Icon name={focused ? activeName : name} size="md" color={color} />;
    };

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
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('profile', 'profileActive') }} />
    </Tabs>
  );
}