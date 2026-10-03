import { useLocalSearchParams } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';

export default function StageViewerScreen() {
  const { stageId } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Live Stage"
      note="Viewer experience: stream, reactions, popularity."
      params={{ stageId, role: 'viewer' }}
    />
  );
}