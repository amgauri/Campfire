import { View } from 'react-native';
import AppText from '@/components/common/AppText';
import Avatar from '@/components/common/Avatar';
import IconButton from '@/components/common/IconButton';
import MediaFrame from '@/components/common/MediaFrame';
import { useTheme } from '@/hooks/useTheme';
import { timeAgo } from '@/utils/time';

export default function PostCard({ post, onToggleLike, onToggleSave, onOpenComments, onOpenAuthor }) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar
          name={post.author.displayName}
          uri={post.author.avatarUrl ?? undefined}
          auraLevel={post.author.auraLevel}
          onPress={onOpenAuthor}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="subheading">{post.author.displayName}</AppText>
          <AppText variant="caption" tone="muted">
            @{post.author.username} · {timeAgo(post.createdAt)}
          </AppText>
        </View>
      </View>

      {post.mediaUrl ? (
        <MediaFrame uri={post.mediaUrl} ratio="portrait" alt={`Photo by ${post.author.displayName}`} />
      ) : null}

      {post.caption ? <AppText>{post.caption}</AppText> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton
          icon={post.liked ? 'likeActive' : 'like'}
          active={post.liked}
          activeTone="danger"
          accessibilityLabel={post.liked ? 'Unlike' : 'Like'}
          onPress={onToggleLike}
        />
        <AppText variant="label">{post.likesCount}</AppText>
        <IconButton icon="comment" accessibilityLabel="Comments" onPress={onOpenComments} />
        <AppText variant="label">{post.commentsCount}</AppText>
        <View style={{ flex: 1 }} />
        <IconButton
          icon={post.saved ? 'saveActive' : 'save'}
          active={post.saved}
          accessibilityLabel={post.saved ? 'Unsave' : 'Save'}
          onPress={onToggleSave}
        />
      </View>
    </View>
  );
}