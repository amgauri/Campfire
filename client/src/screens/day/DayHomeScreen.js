import { useRouter } from 'expo-router';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';

export default function DayHomeScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Day"
      large
      leading="none"
      trailing={[
        { icon: 'notifications', label: 'Notifications', onPress: () => router.push(ROUTES.notifications) },
        { icon: 'settings', label: 'Settings', onPress: () => router.push(ROUTES.settings) },
      ]}
      note="The Day feed will live here. These buttons only prove the navigation graph."
      actions={[
        { label: 'Open a post', icon: 'image', onPress: () => router.push(ROUTES.post('demo-post')) },
        { label: 'Open comments (modal)', icon: 'comment', onPress: () => router.push(ROUTES.comments('demo-post')) },
        { label: 'View a user', icon: 'people', onPress: () => router.push(ROUTES.user('u_demo')) },
      ]}
    />
  );
}