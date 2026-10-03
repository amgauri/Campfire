import { View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '@/components/common/AppText';
import IconButton from '@/components/common/IconButton';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';

/**
 * Themed in-screen header (native headers are off app-wide).
 * leading: 'back' | 'close' | 'none'      trailing: [{ icon, label, onPress }]
 * `large` is for tab roots.
 */
export default function ScreenHeader({ title, leading = 'back', onLeadingPress, trailing = [], large = false, style }) {
  const router = useRouter();
  const { spacing } = useTheme();

  const handleLeading = () => {
    if (onLeadingPress) {
      onLeadingPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.home); // e.g. cold start from a deep link
    }
  };

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, marginBottom: spacing.md },
        style,
      ]}
    >
      {leading !== 'none' ? (
        <IconButton
          icon={leading === 'close' ? 'close' : 'back'}
          variant="tonal"
          accessibilityLabel={leading === 'close' ? 'Close' : 'Go back'}
          onPress={handleLeading}
        />
      ) : null}

      <AppText variant={large ? 'title' : 'heading'} accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </AppText>

      {trailing.map((item) => (
        <IconButton
          key={item.label}
          icon={item.icon}
          variant="tonal"
          accessibilityLabel={item.label}
          onPress={item.onPress}
        />
      ))}
    </View>
  );
}