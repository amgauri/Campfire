import { getTheme } from '@/theme';
import { useAppModeStore } from '@/state/stores/appModeStore';

export function useTheme() {
  const mode = useAppModeStore((state) => state.mode);
  return getTheme(mode);
}