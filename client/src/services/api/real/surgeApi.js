import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

export async function getStatus(options) {
  const raw = await http.get(ENDPOINTS.surge.status, options);
  return raw?.data ?? raw;
}