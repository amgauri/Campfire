import type { SurgeStatus } from '../../modules/surge/domain.js';
import type { SurgeOverrideRepository } from '../../modules/surge/port.js';
import { MongoSurgeStatusModel } from './models.js';

export class MongoSurgeStatusRepository implements SurgeOverrideRepository {
  async getStatus(): Promise<SurgeStatus> {
    const status = await MongoSurgeStatusModel.findById('global')
      .lean<{ isActive: boolean }>()
      .exec();
    return {
      isActive: status?.isActive ?? false,
      startsAt: null,
      endsAt: null,
    };
  }

  async setOverride(isActive: boolean): Promise<SurgeStatus> {
    await MongoSurgeStatusModel.findOneAndUpdate(
      { _id: 'global' },
      { $set: { isActive } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    ).exec();
    return this.getStatus();
  }
}
