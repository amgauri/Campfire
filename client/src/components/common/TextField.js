import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import IconButton from '@/components/common/IconButton';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

// React 19: `ref` is a normal prop, so no forwardRef needed.
export default function TextField({
  ref,
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  rightIconLabel,
  onPressRightIcon,
  disabled = false,
  multiline = false,
  maxLength,
  showCounter = false,
  onFocus,
  onBlur,
  style,
  inputStyle,
  ...rest
}) {
  const { colors, spacing } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.focusRing : colors.border;
  const showFooter = Boolean(error || helperText || (showCounter && maxLength));

  return (
    <View style={style}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={[styles.field, multiline && styles.fieldMultiline, { borderColor }, disabled && styles.disabled]}>
        {leftIcon ? <Icon name={leftIcon} tone="muted" /> : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          editable={!disabled}
          multiline={multiline}
          maxLength={maxLength}
          accessibilityLabel={label ?? placeholder}
          accessibilityState={{ disabled }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          {...rest}
        />

        {rightIcon ? (
          <IconButton
            icon={rightIcon}
            size="sm"
            onPress={onPressRightIcon}
            accessibilityLabel={rightIconLabel ?? rightIcon}
            style={{ marginRight: -spacing.sm }}
          />
        ) : null}
      </View>

      {showFooter ? (
        <View style={styles.footer}>
          <View style={styles.footerMessage}>
            {error ? (
              <View style={styles.errorRow}>
                <Icon name="error" size="xs" tone="danger" />
                <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
                  {error}
                </AppText>
              </View>
            ) : helperText ? (
              <AppText variant="caption" tone="muted">
                {helperText}
              </AppText>
            ) : null}
          </View>
          {showCounter && maxLength ? (
            <AppText variant="caption" tone="muted">
              {(value ?? '').length}/{maxLength}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, radius, typography, controlHeights }) =>
  StyleSheet.create({
    label: { marginBottom: spacing.xs },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: controlHeights.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      backgroundColor: colors.surfaceSunken,
    },
    fieldMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: typography.body.fontSize,
      paddingVertical: spacing.sm,
    },
    inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
    disabled: { opacity: 0.5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs, gap: spacing.sm },
    footerMessage: { flex: 1 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  });