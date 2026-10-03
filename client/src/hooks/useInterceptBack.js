import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Android hardware back: run `onBack` instead of leaving. Pair with gestureEnabled:false for iOS swipe. */
export function useInterceptBack(onBack, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onBack();
        return true;
      });
      return () => subscription.remove();
    }, [onBack, enabled])
  );
}