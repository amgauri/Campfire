import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

/** @returns {Promise<import('@/types/common').HealthStatus>} */
export async function getHealth(options) {
  return http.get(ENDPOINTS.health, options);
}