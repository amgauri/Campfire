import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import AppText from '@/components/common/AppText';
import AuraRing from '@/components/common/AuraRing';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { getInitials, hashString } from '@/utils/text';

/**
 * size: xs | sm | md | lg | xl (or a number)
 * anonymous: Ghost/Surge mode. Photo and name are never shown.
 * auraLevel: 0-3 (provisional, see AuraRing)
 */
export default function Avatar({
  uri,
  name,
  size = 'md',
  auraLevel = 0,
  anonymous = false,
  online = false,
  backdropColor,
  onPress,
  accessibilityLabel,
  style,
}) {
  const { colors, avatarSizes } = useTheme();
  const [failed, setFailed] = useState(false);

  const px = typeof size === 'number' ? size : avatarSizes[size] ?? avatarSizes.md;
  const showImage = !anonymous && Boolean(uri) && !failed;
  const palette = colors.avatarPalette;
  const bg = anonymous ? colors.surfaceSunken : palette[hashString(name) % palette.length];
  const dot = Math.max(8, Math.round(px * 0.24));
  const gapColor = backdropColor ?? colors.background;
  const label =
    accessibilityLabel ??
    (anonymous ? 'Anonymous user' : name ? `${name}, profile photo` : 'Profile photo');

  const body = (
    <AuraRing level={anonymous ? 0 : auraLevel} size={px} backdropColor={backdropColor}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
        }}
      >
        {showImage ? (
          <Image source={{ uri }} style={{ width: px, height: px }} onError={() => setFailed(true)} />
        ) : anonymous ? (
          <Icon name="anonymous" size={Math.round(px * 0.5)} tone="muted" />
        ) : (
          <AppText
            variant="label"
            allowFontScaling={false}
            style={{ fontSize: px * 0.38, lineHeight: px * 0.46 }}
          >
            {getInitials(name)}
          </AppText>
        )}
      </View>

      {online ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: gapColor,
          }}
        />
      ) : null}
    </AuraRing>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={px < 44 ? Math.ceil((44 - px) / 2) : 0}
        style={style}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={style}>
      {body}
    </View>
  );
}