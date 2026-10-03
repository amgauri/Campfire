import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Drives enter/exit animation for sheets and dialogs.
 * `rendered` keeps the Modal mounted until the exit animation finishes.
 * `progress` animates 0 -> 1.
 */
export function useOverlayAnimation(visible) {
  const { motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const [rendered, setRendered] = useState(visible);
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    if (visible) setRendered(true);

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : motion.duration.base,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });

    return () => animation.stop();
  }, [visible, reduceMotion, motion, progress]);

  return { rendered, progress };
}