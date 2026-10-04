import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

export async function getHealth(options) {
  const raw = await http.get(ENDPOINTS.health, options);
  return {
    status: raw?.data?.status ?? 'unknown',
    service: 'campfire-api',
    timestamp: new Date().toISOString(),
  };
}