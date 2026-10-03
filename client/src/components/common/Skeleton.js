import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Placeholder block. Hidden from screen readers: the screen that shows skeletons
 * should expose a "Loading" label (e.g. via Spinner or accessibilityLabel on the list).
 */
export default function Skeleton({ width = '100%', height = 16, radius = 'sm', style }) {
  const { colors, radius: radii, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: motion.duration.slow, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: motion.duration.slow, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, opacity, motion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: typeof radius === 'number' ? radius : radii[radius] ?? radii.sm,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}