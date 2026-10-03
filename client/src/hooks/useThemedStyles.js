import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * `factory` must be a module-level function: (theme) => StyleSheet.create({...}).
 * Styles are rebuilt only when the theme (Day/Night) changes.
 */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}