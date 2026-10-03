import { Pressable } from 'react-native';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { TONE_TOKENS } from '@/theme/tones';
import { logger } from '@/utils/logger';

/** Icon-only buttons MUST have an accessibilityLabel. variant: plain | tonal | filled */
export default function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 'md',
  active = false,
  activeTone = 'accent',
  disabled = false,
  style,
}) {
  const { colors, iconSizes, touchTarget, spacing, radius, motion } = useTheme();

  if (__DEV__ && !accessibilityLabel) logger.warn('IconButton needs an accessibilityLabel:', icon);

  const box = Math.max(touchTarget, iconSizes[size] + spacing.md * 2);
  const bg =
    variant === 'filled' ? colors.accent : variant === 'tonal' ? colors.surfaceSunken : 'transparent';
  const fg =
    variant === 'filled'
      ? colors.textOnAccent
      : active
        ? colors[TONE_TOKENS[activeTone]]
        : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? motion.pressedOpacity : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={fg} />
    </Pressable>
  );
}