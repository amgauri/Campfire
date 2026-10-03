import * as health from './healthApi';
import * as auth from './authApi';
import * as surge from './surgeApi';

// Must export the same shape as ../real/index.js.
export function createMockApi() {
  return { health, auth, surge };
}