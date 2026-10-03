import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const SIZE_TEXT = { sm: 'label', md: 'bodyStrong', lg: 'subheading' };
const SIZE_ICON = { sm: 'sm', md: 'md', lg: 'md' };
const SIZE_PAD = { sm: 'lg', md: 'xl', lg: 'xl' };

function getVariant(colors, variant) {
  switch (variant) {
    case 'secondary':
      return { bg: colors.surfaceRaised, fg: colors.text, border: colors.borderStrong };
    case 'ghost':
      return { bg: 'transparent', fg: colors.textAccent, border: 'transparent' };
    case 'danger':
      return { bg: colors.danger, fg: colors.textOnDanger, border: 'transparent' };
    case 'surge':
      return { bg: colors.highlight, fg: colors.textOnHighlight, border: 'transparent' };
    case 'primary':
    default:
      return { bg: colors.accent, fg: colors.textOnAccent, border: 'transparent' };
  }
}

/** variant: primary | secondary | ghost | danger | surge   size: sm | md | lg */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}) {
  const { colors, spacing, controlHeights } = useTheme();
  const styles = useThemedStyles(createStyles);
  const v = getVariant(colors, variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      hitSlop={size === 'sm' ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: controlHeights[size],
          paddingHorizontal: spacing[SIZE_PAD[size]],
          backgroundColor: v.bg,
          borderColor: v.border,
        },
        fullWidth && styles.full,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {leftIcon ? <Icon name={leftIcon} size={SIZE_ICON[size]} color={v.fg} /> : null}
          <AppText variant={SIZE_TEXT[size]} style={{ color: v.fg }} numberOfLines={1}>
            {title}
          </AppText>
          {rightIcon ? <Icon name={rightIcon} size={SIZE_ICON[size]} color={v.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

const createStyles = ({ spacing, radius, motion }) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    full: { alignSelf: 'stretch' },
    disabled: { opacity: 0.45 },
    pressed: { opacity: motion.pressedOpacity, transform: [{ scale: motion.pressedScale }] },
  });