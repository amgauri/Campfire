import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TONE_TOKENS } from '@/theme/tones';

export default function AppText({
  variant = 'body',
  tone = 'default',
  align,
  style,
  maxFontSizeMultiplier = 1.5, // allow OS font scaling, but cap it so layouts survive
  ...rest
}) {
  const { colors, typography } = useTheme();

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        typography[variant] ?? typography.body,
        { color: colors[TONE_TOKENS[tone]] ?? colors.text },
        variant === 'overline' && { textTransform: 'uppercase' },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}