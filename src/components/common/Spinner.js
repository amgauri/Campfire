import { ActivityIndicator, View } from 'react-native';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

/** size: small | large. `centered` fills the available space. */
export default function Spinner({ size = 'large', label, centered = false, style }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[
        { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
        centered && { flex: 1 },
        style,
      ]}
    >
      <ActivityIndicator size={size} color={colors.accent} />
      {label ? (
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}