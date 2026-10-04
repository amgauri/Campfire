import type { SurgeStatus } from './domain.js';

export interface SurgeStatusSource {
  getStatus(): Promise<SurgeStatus>;
}

export interface SurgeOverrideRepository extends SurgeStatusSource {
  setOverride(isActive: boolean): Promise<SurgeStatus>;
}
