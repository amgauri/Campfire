import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export const unstable_settings = { anchor: 'login' };

export default function AuthLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}