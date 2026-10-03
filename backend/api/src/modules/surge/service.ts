import type { SurgeStatus } from './domain.js';
import type { SurgeStatusSource } from './port.js';

// Closing Surge prevents new queue joins and matches; existing matches finish normally.
export class SurgeStatusService {
  constructor(private readonly source: SurgeStatusSource) {}

  getStatus(): Promise<SurgeStatus> {
    return this.source.getStatus();
  }
}
