import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

// PROVISIONAL: the backend defines what "aura" looks like in API data.
// Until then: level 0 = none, 1 = ring, 2 = ring + soft glow, 3 = thick ring + strong glow.
const LEVELS = {
  1: { ring: 2, glow: 0, glowOpacity: 0 },
  2: { ring: 3, glow: 5, glowOpacity: 0.22 },
  3: { ring: 4, glow: 9, glowOpacity: 0.38 },
};
const GAP = 2; // space between avatar and ring

/**
 * Draws the ring OUTSIDE the child's bounds, so layout never shifts between
 * users with and without aura. Leave a little margin around it in lists.
 * `backdropColor` fills the gap; match the surface the avatar sits on.
 */
export default function AuraRing({ level = 0, size, backdropColor, children, style }) {
  const { colors } = useTheme();
  const config = LEVELS[Math.min(3, Math.max(0, Math.floor(level)))];

  if (!config) {
    return <View style={[{ width: size, height: size }, style]}>{children}</View>;
  }

  const inset = GAP + config.ring;
  const ringSize = size + inset * 2;
  const innerSize = size + GAP * 2;
  const glowSize = ringSize + config.glow * 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {config.glow > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -(inset + config.glow),
            left: -(inset + config.glow),
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: colors.auraGlow,
            opacity: config.glowOpacity,
          }}
        />
      ) : null}

      <LinearGradient
        colors={colors.auraGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: -inset,
          left: -inset,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -GAP,
          left: -GAP,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: backdropColor ?? colors.background,
        }}
      />

      {children}
    </View>
  );
}