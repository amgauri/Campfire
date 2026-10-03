import { sleep } from '@/utils/sleep';

// Mock default is LIVE so Surge flows are easy to build. Toggle it from Settings (dev tools).
let active = true;

/** @returns {Promise<import('@/types/common').SurgeStatus>} */
export async function getStatus() {
  await sleep(300);
  const now = Date.now();

  if (active) {
    return {
      isActive: true,
      startsAt: new Date(now - 30 * 60 * 1000).toISOString(),
      endsAt: new Date(now + 90 * 60 * 1000).toISOString(),
    };
  }

  const next = new Date(now);
  next.setHours(21, 0, 0, 0);
  if (next.getTime() <= now) next.setDate(next.getDate() + 1);
  return { isActive: false, startsAt: next.toISOString(), endsAt: null };
}

/** Mock-only. The real module does not export this, so dev UI hides itself against a real backend. */
export function _devSetActive(value) {
  active = Boolean(value);
}