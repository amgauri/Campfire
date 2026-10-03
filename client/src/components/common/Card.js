import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/** variant: raised | outlined | flat | highlight    padding: none | xs | sm | md | lg | xl */
export default function Card({
  variant = 'raised',
  padding = 'lg',
  onPress,
  accessibilityLabel,
  style,
  children,
}) {
  const { colors, spacing, radius, elevation, motion } = useTheme();

  const variants = {
    raised: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, ...elevation.sm },
    outlined: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
    flat: { backgroundColor: colors.surface, borderColor: 'transparent' },
    highlight: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  };

  const base = [
    { borderRadius: radius.lg, borderWidth: 1, padding: spacing[padding] ?? 0 },
    variants[variant] ?? variants.raised,
  ];

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: motion.pressedOpacity }, style]}
    >
      {children}
    </Pressable>
  );
}