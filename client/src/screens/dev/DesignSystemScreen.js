import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppText from '@/components/common/AppText';
import Avatar from '@/components/common/Avatar';
import BottomSheet from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Chip from '@/components/common/Chip';
import Dialog from '@/components/common/Dialog';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import IconButton from '@/components/common/IconButton';
import MediaFrame from '@/components/common/MediaFrame';
import Screen from '@/components/common/Screen';
import Skeleton from '@/components/common/Skeleton';
import Spinner from '@/components/common/Spinner';
import TextField from '@/components/common/TextField';
import { useTheme } from '@/hooks/useTheme';
import { useAppModeStore } from '@/state/stores/appModeStore';

function Section({ title, children }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({ children, gap = 'sm', center = false }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[gap],
        alignItems: center ? 'center' : 'flex-start',
      }}
    >
      {children}
    </View>
  );
}

const INTERESTS = ['Music', 'Gaming', 'Memes', 'Sports', 'Anime'];
const DEMO_IMAGE = 'https://picsum.photos/seed/campfire/600/600';

export default function DesignSystemScreen() {
  const router = useRouter();
  const { colors, spacing, typography, mode } = useTheme();
  const setMode = useAppModeStore((state) => state.setMode);

  const [text, setText] = useState('');
  const [picked, setPicked] = useState(['Music']);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleInterest = (item) =>
    setPicked((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const swatches = Object.entries(colors).filter(([, value]) => typeof value === 'string');

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xxl, paddingBottom: spacing.xxxl }}>
        <Row center>
          <IconButton icon="back" variant="tonal" accessibilityLabel="Go back" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">Design system</AppText>
          </View>
        </Row>

        <Button
          title={`Switch to ${mode === 'day' ? 'Night' : 'Day'}`}
          variant={mode === 'day' ? 'surge' : 'primary'}
          leftIcon={mode === 'day' ? 'night' : 'day'}
          onPress={() => setMode(mode === 'day' ? 'night' : 'day')}
        />

        <Section title="Colors (semantic tokens)">
          <Row>
            {swatches.map(([name, value]) => (
              <View key={name} style={{ width: 76, gap: spacing.xs }}>
                <View
                  style={{
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: value,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <AppText variant="caption" numberOfLines={1} style={{ fontSize: 10, lineHeight: 12 }}>
                  {name}
                </AppText>
              </View>
            ))}
          </Row>
        </Section>

        <Section title="Typography">
          {Object.keys(typography).map((variant) => (
            <AppText key={variant} variant={variant}>
              {variant}: Campfire tonight
            </AppText>
          ))}
          <AppText tone="muted">muted</AppText>
          <AppText tone="accent">accent</AppText>
          <AppText tone="highlight">highlight</AppText>
          <AppText tone="danger">danger</AppText>
          <AppText tone="success">success</AppText>
        </Section>

        <Section title="Buttons">
          <Button title="Primary" />
          <Button title="Secondary" variant="secondary" />
          <Button title="Ghost" variant="ghost" />
          <Button title="Danger" variant="danger" leftIcon="close" />
          <Button title="Join Surge" variant="surge" leftIcon="surge" />
          <Button title="Loading" loading />
          <Button title="Disabled" disabled />
          <Row center>
            <Button title="Small" size="sm" />
            <Button title="Medium" size="md" variant="secondary" />
            <Button title="Large" size="lg" variant="secondary" />
          </Row>
          <Row center>
            <IconButton
              icon={liked ? 'likeActive' : 'like'}
              active={liked}
              activeTone="danger"
              accessibilityLabel={liked ? 'Unlike' : 'Like'}
              onPress={() => setLiked((v) => !v)}
            />
            <IconButton icon="comment" accessibilityLabel="Comment" />
            <IconButton
              icon={saved ? 'saveActive' : 'save'}
              active={saved}
              accessibilityLabel={saved ? 'Unsave' : 'Save'}
              onPress={() => setSaved((v) => !v)}
            />
            <IconButton icon="share" accessibilityLabel="Share" />
            <IconButton icon="add" variant="filled" accessibilityLabel="New post" />
          </Row>
        </Section>

        <Section title="Inputs">
          <TextField
            label="Caption"
            placeholder="What's happening on campus?"
            value={text}
            onChangeText={setText}
            maxLength={120}
            showCounter
            helperText="Keep it fun."
            leftIcon="search"
          />
          <TextField label="With error" value="oops" error="That doesn't look right." />
          <TextField label="Disabled" value="Can't edit" disabled />
          <TextField label="Multiline" placeholder="Write something..." multiline />
          <Row>
            {INTERESTS.map((item) => (
              <Chip key={item} label={item} selected={picked.includes(item)} onPress={() => toggleInterest(item)} />
            ))}
          </Row>
        </Section>

        <Section title="Cards">
          <Card>
            <AppText variant="subheading">Raised</AppText>
            <AppText tone="muted">Default feed card.</AppText>
          </Card>
          <Card variant="outlined">
            <AppText variant="subheading">Outlined</AppText>
          </Card>
          <Card variant="flat">
            <AppText variant="subheading">Flat</AppText>
          </Card>
          <Card variant="highlight" onPress={() => {}} accessibilityLabel="Highlighted pressable card">
            <AppText variant="subheading">Highlight (pressable)</AppText>
          </Card>
        </Section>

        <Section title="Avatars and Aura (levels 0-3, anonymous, online)">
          <Row gap="xl" center>
            <Avatar name="Aarav Sharma" size="lg" auraLevel={0} />
            <Avatar name="Meera K" size="lg" auraLevel={1} />
            <Avatar name="Rohan Das" size="lg" auraLevel={2} online />
            <Avatar name="Isha Verma" size="lg" auraLevel={3} />
          </Row>
          <Row gap="xl" center>
            <Avatar anonymous size="lg" />
            <Avatar uri={DEMO_IMAGE} name="Photo user" size="lg" auraLevel={3} />
            <Avatar name="Sm" size="sm" />
            <Avatar name="Xs" size="xs" />
          </Row>
        </Section>

        <Section title="Loading">
          <Spinner size="small" label="Finding people..." />
          <View style={{ gap: spacing.sm }}>
            <Row center>
              <Skeleton width={44} height={44} radius="full" />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} />
              </View>
            </Row>
            <Skeleton height={160} radius="md" />
          </View>
        </Section>

        <Section title="Error and empty states">
          <Card variant="outlined" padding="none">
            <ErrorState error={{ code: 'NETWORK_ERROR' }} onRetry={() => {}} />
          </Card>
          <Card variant="outlined" padding="none">
            <EmptyState
              title="No posts yet"
              message="Be the first to post something for campus."
              actionLabel="Create post"
              onAction={() => {}}
            />
          </Card>
        </Section>

        <Section title="Media">
          <MediaFrame uri={DEMO_IMAGE} ratio="landscape" alt="Sample landscape photo">
            <View style={{ position: 'absolute', top: spacing.sm, left: spacing.sm }}>
              <Chip label="Overlay badge" selected />
            </View>
          </MediaFrame>
          <Row>
            <MediaFrame uri={DEMO_IMAGE} ratio="portrait" alt="Blurred preview" blurRadius={20} style={{ width: '48%' }} />
            <MediaFrame uri="https://invalid.example/broken.jpg" ratio="portrait" alt="Broken image" style={{ width: '48%' }} />
          </Row>
        </Section>

        <Section title="Modals">
          <Button title="Open bottom sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
          <Button title="Open dialog" variant="secondary" onPress={() => setDialogOpen(true)} />
        </Section>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Share to...">
        <View style={{ gap: spacing.md }}>
          <AppText tone="muted">Sheets are for choices, forms and sharing.</AppText>
          <Button title="Send to a friend" leftIcon="send" onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Leave the Surge?"
        message="You'll lose your place in the queue."
        actions={[
          { label: 'Leave', variant: 'danger', onPress: () => setDialogOpen(false) },
          { label: 'Stay', variant: 'ghost', onPress: () => setDialogOpen(false) },
        ]}
      />
    </Screen>
  );
}