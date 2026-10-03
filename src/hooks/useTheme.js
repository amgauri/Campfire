import { palettes, spacing, radius, typography } from '@/constants/theme';
import { useAppModeStore } from '@/state/stores/appModeStore';

export function useTheme() {
  const mode = useAppModeStore((state) => state.mode);
  return { mode, colors: palettes[mode], spacing, radius, typography };
}