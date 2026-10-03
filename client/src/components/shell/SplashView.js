import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import Spinner from '@/components/common/Spinner';
import { useTheme } from '@/hooks/useTheme';

/** In-app loading screen shown over the navigator while the session restores. */
export default function SplashView() {
  const { colors, spacing } = useTheme();

  // Hand over from the native splash once this view is on screen.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
      ]}
    >
      <Icon name="surgeActive" size="xl" tone="accent" />
      <AppText variant="display">Campfire</AppText>
      <Spinner size="small" />
    </View>
  );
}