import * as health from './healthApi';

// Must export the same shape as ../real/index.js.
export function createMockApi() {
  return { health };
}