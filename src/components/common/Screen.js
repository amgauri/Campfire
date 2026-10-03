import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export default function Screen({ children, style }) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.flex, { padding: spacing.md }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});