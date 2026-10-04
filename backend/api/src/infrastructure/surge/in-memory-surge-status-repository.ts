import type { SurgeStatus } from '../../modules/surge/domain.js';
import type { SurgeOverrideRepository } from '../../modules/surge/port.js';

export class InMemorySurgeStatusRepository implements SurgeOverrideRepository {
  private active = false;

  getStatus(): Promise<SurgeStatus> {
    return Promise.resolve({
      isActive: this.active,
      startsAt: null,
      endsAt: null,
    });
  }

  setOverride(isActive: boolean): Promise<SurgeStatus> {
    this.active = isActive;
    return this.getStatus();
  }
}
