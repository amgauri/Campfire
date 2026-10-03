import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function AppText({ variant = 'body', muted = false, style, ...rest }) {
  const { colors, typography } = useTheme();

  return (
    <Text
      style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...rest}
    />
  );
}