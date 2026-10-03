import * as health from './healthApi';
import * as auth from './authApi';
import * as surge from './surgeApi';

export function createRealApi() {
  return { health, auth, surge };
}