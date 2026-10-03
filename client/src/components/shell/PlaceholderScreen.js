import { ScrollView, View } from 'react-native';
import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Screen from '@/components/common/Screen';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';

/** Stand-in for screens built in later stages. Proves the route and shows its params. */
export default function PlaceholderScreen({
  title,
  note,
  params,
  leading = 'back',
  large = false,
  trailing,
  actions = [],
  children,
}) {
  const { spacing } = useTheme();

  return (
    <Screen>
      <ScreenHeader title={title} leading={leading} large={large} trailing={trailing} />
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <Card variant="flat" style={{ gap: spacing.xs }}>
          <AppText variant="overline" tone="muted">
            Placeholder
          </AppText>
          {note ? <AppText>{note}</AppText> : null}
          {params
            ? Object.entries(params).map(([key, value]) => (
                <AppText key={key} variant="caption" tone="muted">
                  {key}: {String(value)}
                </AppText>
              ))
            : null}
        </Card>

        {children}

        <View style={{ gap: spacing.sm }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              title={action.label}
              variant={action.variant ?? 'secondary'}
              leftIcon={action.icon}
              onPress={action.onPress}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}