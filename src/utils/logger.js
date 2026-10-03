import { env } from '@/config/env';

const noop = () => {};

export const logger = {
  debug: env.isProduction ? noop : (...args) => console.log('[debug]', ...args),
  info: env.isProduction ? noop : (...args) => console.info('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
};