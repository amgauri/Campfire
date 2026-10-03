import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography } from './typography';
import { createElevation } from './elevation';
import { iconSizes, avatarSizes, controlHeights, touchTarget } from './sizes';
import { motion } from './motion';

function buildTheme(mode) {
  return Object.freeze({
    mode,
    isNight: mode === 'night',
    colors: colors[mode],
    spacing,
    radius,
    typography,
    elevation: createElevation(mode),
    iconSizes,
    avatarSizes,
    controlHeights,
    touchTarget,
    motion,
  });
}

// Built once, so references are stable between renders.
export const themes = Object.freeze({ day: buildTheme('day'), night: buildTheme('night') });

export function getTheme(mode) {
  return themes[mode] ?? themes.day;
}