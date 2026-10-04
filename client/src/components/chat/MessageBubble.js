import { View } from 'react-native';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export default function MessageBubble({ text, mine }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: mine ? colors.accent : colors.surfaceRaised,
        borderWidth: mine ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <AppText tone={mine ? 'onAccent' : 'default'}>{text}</AppText>
    </View>
  );
}