import { sleep } from '@/utils/sleep';

/** @returns {Promise<import('@/types/common').HealthStatus>} */
export async function getHealth() {
  await sleep(400);
  return {
    status: 'ok',
    service: 'campfire-api-mock',
    timestamp: new Date().toISOString(),
  };
}