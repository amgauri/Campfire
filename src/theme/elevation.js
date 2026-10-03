const shadow = (opacity, blur, y, elevation) => ({
  shadowColor: '#000000',
  shadowOpacity: opacity,
  shadowRadius: blur,
  shadowOffset: { width: 0, height: y },
  elevation,
});

// Shadows are nearly invisible on dark backgrounds, so Night is stronger and
// components also add borders in Night for separation.
export function createElevation(mode) {
  const night = mode === 'night';
  return Object.freeze({
    none: shadow(0, 0, 0, 0),
    sm: shadow(night ? 0.4 : 0.06, 4, 2, 2),
    md: shadow(night ? 0.5 : 0.1, 10, 4, 4),
    lg: shadow(night ? 0.6 : 0.16, 18, 8, 8),
  });
}