import { useLayoutEffect } from 'react';
import { useSegments } from 'expo-router';
import { deriveAppMode } from '@/navigation/appMode';
import { useAppModeStore } from '@/state/stores/appModeStore';

/** Renders nothing. Keeps appModeStore in step with the current route. */
export default function ModeSync() {
  const segments = useSegments();
  const setMode = useAppModeStore((state) => state.setMode);
  const mode = deriveAppMode(segments);
  const routeKey = segments.join('/');

  // Layout effect: the theme flips before the next paint, so there's no one-frame mismatch.
  // routeKey re-asserts the derived mode on every navigation (dev toggles can't stick).
  useLayoutEffect(() => {
    setMode(mode);
  }, [mode, routeKey, setMode]);

  return null;
}