import type { SurgeStatus } from './domain.js';

export interface SurgeStatusSource {
  getStatus(): Promise<SurgeStatus>;
}
