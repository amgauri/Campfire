import { env } from '@/config/env';
import { logger } from '@/utils/logger';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// The auth store provides its in-memory access token without coupling screens to HTTP.
let authTokenProvider = () => null;
let authRefreshHandler = null;
let refreshedAccessToken = null;
let refreshInFlight = null;

export function setAuthTokenProvider(provider) {
  authTokenProvider = typeof provider === 'function' ? provider : () => null;
}

export function setAuthRefreshHandler(handler) {
  authRefreshHandler = typeof handler === 'function' ? handler : null;
}

export function setRefreshedAccessToken(token) {
  refreshedAccessToken = typeof token === 'string' ? token : null;
}

function buildUrl(path, query) {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return params ? `${url}?${params}` : url;
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(
  method,
  path,
  { body, query, headers, signal, timeoutMs, skipAuthRefresh = false } = {},
) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs ?? env.requestTimeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort());
  }

  const token = refreshedAccessToken ?? (await authTokenProvider());

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await parseBody(response);

    if (!response.ok) {
      if (response.status === 401 && token && !skipAuthRefresh && authRefreshHandler) {
        try {
          refreshInFlight ??= Promise.resolve().then(authRefreshHandler).finally(() => {
            refreshInFlight = null;
          });
          const accessToken = await refreshInFlight;
          if (accessToken) {
            refreshedAccessToken = accessToken;
            return request(method, path, {
              body,
              query,
              headers,
              signal,
              timeoutMs,
              skipAuthRefresh: true,
            });
          }
        } catch {
          // Keep the original request error; the session can be restored on next login.
        }
      }
      throw new ApiError(
        (data && data.message) || `Request failed with status ${response.status}`,
        { status: response.status, code: (data && data.code) || 'HTTP_ERROR', details: data }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error && error.name === 'AbortError') {
      if (timedOut) throw new ApiError('Request timed out', { code: 'TIMEOUT' });
      throw error; // cancelled by caller (e.g. React Query)
    }

    logger.warn('Network error', method, path, error);
    throw new ApiError('Network request failed', { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};
