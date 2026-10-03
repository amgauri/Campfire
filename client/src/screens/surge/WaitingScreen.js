import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import Dialog from '@/components/common/Dialog';
import Spinner from '@/components/common/Spinner';
import PlaceholderScreen from '@/components/shell/PlaceholderScreen';
import { ROUTES } from '@/constants/routes';
import { useDevSurgeControls } from '@/hooks/useDevSurgeControls';
import { useInterceptBack } from '@/hooks/useInterceptBack';

export default function WaitingScreen() {
  const router = useRouter();
  const dev = useDevSurgeControls();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const askToLeave = useCallback(() => setLeaveOpen(true), []);
  useInterceptBack(askToLeave); // Android back asks first; iOS swipe is disabled in the layout

  const leave = () => {
    setLeaveOpen(false);
    // Later: tell the server we left the queue.
    router.dismissAll();
  };

  const actions = [{ label: 'Leave queue', icon: 'close', onPress: askToLeave }];
  if (dev.available) {
    actions.unshift(
      { label: 'Dev: simulate match found', icon: 'people', onPress: () => router.replace(ROUTES.match('demo-match')) },
      { label: 'Dev: end Surge', icon: 'night', onPress: () => dev.setActive(false) }
    );
  }

  return (
    <>
      <PlaceholderScreen
        title="Waiting"
        leading="none"
        note="Queue state and the match event come from the server later."
        actions={actions}
      >
        <Spinner label="Looking for someone on campus..." />
      </PlaceholderScreen>

      <Dialog
        visible={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave the Surge?"
        message="You'll lose your place in the queue."
        actions={[
          { label: 'Leave', variant: 'danger', onPress: leave },
          { label: 'Stay', variant: 'ghost', onPress: () => setLeaveOpen(false) },
        ]}
      />
    </>
  );
}