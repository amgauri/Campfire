import { Ionicons } from '@expo/vector-icons';
import { ICONS } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { TONE_TOKENS } from '@/theme/tones';
import { logger } from '@/utils/logger';

/** Decorative by default (hidden from screen readers). Put the meaning on the parent control. */
export default function Icon({ name, size = 'md', tone = 'default', color, style }) {
  const { colors, iconSizes } = useTheme();
  const glyph = ICONS[name];

  if (!glyph) logger.warn('Unknown icon key:', name);

  const pixels = typeof size === 'number' ? size : iconSizes[size] ?? iconSizes.md;

  return (
    <Ionicons
      name={glyph ?? 'help-circle-outline'}
      size={pixels}
      color={color ?? colors[TONE_TOKENS[tone]] ?? colors.text}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}