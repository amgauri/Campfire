import { http } from '../httpClient';
import { ENDPOINTS } from '../endpoints';

/** @returns {Promise<import('@/types/common').SurgeStatus>} */
export const getStatus = (options) => http.get(ENDPOINTS.surge.status, options);