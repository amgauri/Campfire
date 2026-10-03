import { View } from 'react-native';
import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';

/** tone: neutral | danger. Include a next step (actionLabel) whenever one exists. */
export default function EmptyState({
  icon = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
  style,
}) {
  const { colors, spacing } = useTheme();
  const danger = tone === 'danger';

  return (
    <View
      style={[{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }, style]}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? colors.dangerSoft : colors.surfaceSunken,
        }}
      >
        <Icon name={icon} size="xl" tone={danger ? 'danger' : 'muted'} />
      </View>

      <AppText variant="heading" align="center" accessibilityRole="header">
        {title}
      </AppText>

      {message ? (
        <AppText tone="muted" align="center">
          {message}
        </AppText>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={danger ? 'secondary' : 'primary'}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}