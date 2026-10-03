import { Pressable, StyleSheet } from 'react-native';
import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

/** Selectable pill, e.g. for choosing interests. */
export default function Chip({ label, selected = false, onPress, leftIcon, disabled = false, style }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surfaceSunken,
          borderColor: selected ? colors.accent : colors.border,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {leftIcon ? <Icon name={leftIcon} size="sm" tone={selected ? 'accent' : 'muted'} /> : null}
      <AppText variant="label" tone={selected ? 'accent' : 'default'}>
        {label}
      </AppText>
      {selected ? <Icon name="check" size="xs" tone="accent" /> : null}
    </Pressable>
  );
}

const createStyles = ({ spacing, radius, motion }) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1.5,
    },
    disabled: { opacity: 0.45 },
    pressed: { opacity: motion.pressedOpacity },
  });