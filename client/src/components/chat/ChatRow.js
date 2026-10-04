import { Pressable, View } from 'react-native';
import AppText from '@/components/common/AppText';
import Avatar from '@/components/common/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { timeAgo } from '@/utils/time';

export default function ChatRow({ chat, onPress }) {
  const { colors, spacing, motion } = useTheme();
  const { partner, lastMessage, unreadCount } = chat;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${partner.displayName}${unreadCount ? `, ${unreadCount} unread` : ''}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? motion.pressedOpacity : 1,
      })}
    >
      <Avatar name={partner.displayName} uri={partner.avatarUrl ?? undefined} auraLevel={partner.auraLevel} />
      <View style={{ flex: 1 }}>
        <AppText variant={unreadCount ? 'bodyStrong' : 'body'} numberOfLines={1}>
          {partner.displayName}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {lastMessage?.text ?? 'Say hi 👋'}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
        {lastMessage ? (
          <AppText variant="caption" tone="muted">
            {timeAgo(lastMessage.createdAt)}
          </AppText>
        ) : null}
        {unreadCount ? (
          <View
            style={{
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              paddingHorizontal: 6,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="caption" tone="onAccent" style={{ fontWeight: '700' }}>
              {unreadCount}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}