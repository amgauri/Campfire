import type { SurgeStatus } from '../../modules/surge/domain.js';
import type { SurgeStatusSource } from '../../modules/surge/port.js';

export class InactiveSurgeStatusSource implements SurgeStatusSource {
  getStatus(): Promise<SurgeStatus> {
    return Promise.resolve({ isActive: false, startsAt: null, endsAt: null });
  }
}
