import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import AppText from '@/components/common/AppText';
import Button from '@/components/common/Button';
import MediaFrame from '@/components/common/MediaFrame';
import Screen from '@/components/common/Screen';
import TextField from '@/components/common/TextField';
import ScreenHeader from '@/components/shell/ScreenHeader';
import { useCreatePost } from '@/hooks/useFeed';
import { useTheme } from '@/hooks/useTheme';
import { getErrorCopy } from '@/utils/errorCopy';

export default function CreatePostScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const create = useCreatePost();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = () =>
    create.mutate({ caption, imageUri }, { onSuccess: () => router.back() });

  const canPost = Boolean(caption.trim() || imageUri);

  return (
    <Screen>
      <ScreenHeader title="New post" leading="close" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
      >
        <TextField
          label="Caption"
          placeholder="What's happening on campus?"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={280}
          showCounter
        />

        {imageUri ? (
          <>
            <MediaFrame uri={imageUri} ratio="portrait" alt="Selected photo" />
            <Button title="Remove photo" variant="ghost" leftIcon="close" onPress={() => setImageUri(null)} />
          </>
        ) : (
          <Button title="Add photo" variant="secondary" leftIcon="image" onPress={pickImage} />
        )}

        {create.isError ? (
          <AppText tone="danger" accessibilityLiveRegion="polite">
            {getErrorCopy(create.error).message}
          </AppText>
        ) : null}

        <Button title="Post" onPress={submit} loading={create.isPending} disabled={!canPost} fullWidth />
      </ScrollView>
    </Screen>
  );
}