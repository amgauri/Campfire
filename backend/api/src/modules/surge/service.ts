import type { SurgeStatus } from './domain.js';
import type { SurgeOverrideRepository, SurgeStatusSource } from './port.js';

// Closing Surge prevents new queue joins and matches; existing matches finish normally.
export class SurgeStatusService {
  constructor(
    private readonly source: SurgeStatusSource,
    private readonly overrides?: SurgeOverrideRepository,
  ) {}

  getStatus(): Promise<SurgeStatus> {
    return this.source.getStatus();
  }

  setOverride(isActive: boolean): Promise<SurgeStatus> | null {
    return this.overrides?.setOverride(isActive) ?? null;
  }
}
