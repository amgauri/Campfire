import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import { useOverlayAnimation } from '@/hooks/useOverlayAnimation';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const noop = () => {};

/**
 * Convention: dialogs are for confirmations and destructive choices.
 * actions: [{ label, onPress, variant }] where the first is primary, destructive
 * ones use variant "danger", and "Cancel" goes last as "ghost".
 */
export default function Dialog({ visible, onClose, title, message, actions = [], dismissible = true, children }) {
  const styles = useThemedStyles(createStyles);
  const { rendered, progress } = useOverlayAnimation(visible);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissible ? onClose : noop}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[styles.card, { opacity: progress, transform: [{ scale }] }]}
        >
          {title ? (
            <AppText variant="heading" accessibilityRole="header">
              {title}
            </AppText>
          ) : null}
          {message ? <AppText tone="muted">{message}</AppText> : null}
          {children}
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.label}
                title={action.label}
                variant={action.variant ?? 'secondary'}
                onPress={action.onPress}
                fullWidth
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, spacing, radius, elevation }) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    scrim: { backgroundColor: colors.overlay },
    card: {
      width: '100%',
      maxWidth: 400,
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      ...elevation.lg,
    },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
  });