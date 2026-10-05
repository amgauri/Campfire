import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

/** @returns {Promise<import('@/types/common').SurgeStatus>} */
export async function getStatus(options) {
  const response = await http.get(ENDPOINTS.surge.status, options);
  return response.data;
}
