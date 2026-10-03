import { useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';

export default function StageHostScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Host a stage"
      note="Host controls: go live, moderate, end stream."
      params={{ role: 'host' }}
      actions={[{ label: 'End stage', variant: 'danger', icon: 'close', onPress: () => router.back() }]}
    />
  );
}