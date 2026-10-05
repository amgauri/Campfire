import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppText from '@/components/common/AppText';
import Icon from '@/components/common/Icon';
import Skeleton from '@/components/common/Skeleton';
import { useTheme } from '@/hooks/useTheme';

const RATIOS = { square: 1, portrait: 4 / 5, landscape: 16 / 9, story: 9 / 16 };

/**
 * The ONE place feed/profile/stage images are rendered, so swapping to expo-image
 * later is a single-file change. `alt` is required unless `decorative`.
 * Children render as an overlay: position them with `position: 'absolute'`.
 * `blurRadius` is for blurred image previews (blurred VIDEO comes in the Surge stage).
 */
export default function MediaFrame({
  uri,
  ratio = 'square',
  radius = 'md',
  alt,
  decorative = false,
  blurRadius,
  children,
  style,
}) {
  const { colors, spacing, radius: radii } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasMedia = Boolean(uri) && !failed;

  return (
    <View
      accessible={!decorative && Boolean(alt)}
      accessibilityRole="image"
      accessibilityLabel={alt}
      style={[
        {
          aspectRatio: RATIOS[ratio] ?? ratio,
          borderRadius: typeof radius === 'number' ? radius : radii[radius] ?? radii.md,
          overflow: 'hidden',
          backgroundColor: colors.surfaceSunken,
        },
        style,
      ]}
    >
      {hasMedia ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={blurRadius}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: spacing.xs }]}>
          <Icon name="image" size="lg" tone="muted" />
          <AppText variant="caption" tone="muted">
            Couldn&apos;t load media
          </AppText>
        </View>
      )}

      {hasMedia && !loaded ? (
        <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFill} />
      ) : null}

      {children}
    </View>
  );
}
