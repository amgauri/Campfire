import { timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import type { RefreshSession } from '../../modules/auth/domain.js';
import type {
  RefreshSessionRepository,
  RotateResult,
} from '../../modules/auth/ports.js';
import { MongoRefreshSessionModel } from './models.js';

type RefreshRecord = {
  _id: string;
  familyId: string;
  userId: string;
  verifierHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

function hashesMatch(expected: string, presented: string): boolean {
  const expectedBytes = Buffer.from(expected, 'hex');
  const presentedBytes = Buffer.from(presented, 'hex');
  return (
    expectedBytes.length === presentedBytes.length &&
    timingSafeEqual(expectedBytes, presentedBytes)
  );
}

export class MongoRefreshSessionRepository implements RefreshSessionRepository {
  async create(session: RefreshSession): Promise<void> {
    await MongoRefreshSessionModel.create({
      _id: session.id,
      familyId: session.familyId,
      userId: session.userId,
      verifierHash: session.verifierHash,
      expiresAt: new Date(session.expiresAt),
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
    });
  }

  async rotate(input: {
    currentId: string;
    verifierHash: string;
    replacement: Pick<RefreshSession, 'id' | 'verifierHash'>;
    now: string;
  }): Promise<RotateResult> {
    const session = await mongoose.startSession();
    try {
      let result: RotateResult = { status: 'invalid' };
      await session.withTransaction(async () => {
        const now = new Date(input.now);
        const current = await MongoRefreshSessionModel.findById(input.currentId)
          .session(session)
          .lean<RefreshRecord>()
          .exec();
        if (
          !current ||
          !hashesMatch(current.verifierHash, input.verifierHash)
        ) {
          result = { status: 'invalid' };
          return;
        }
        if (current.revokedAt) {
          await MongoRefreshSessionModel.updateMany(
            { familyId: current.familyId, revokedAt: null },
            { $set: { revokedAt: now } },
            { session },
          );
          result = { status: 'reused' };
          return;
        }
        if (current.expiresAt <= now) {
          result = { status: 'invalid' };
          return;
        }

        const revoked = await MongoRefreshSessionModel.findOneAndUpdate(
          {
            _id: input.currentId,
            verifierHash: input.verifierHash,
            revokedAt: null,
            expiresAt: { $gt: now },
          },
          { $set: { revokedAt: now } },
          { session, returnDocument: 'before' },
        )
          .lean<RefreshRecord>()
          .exec();
        if (!revoked) {
          result = { status: 'reused' };
          return;
        }

        await MongoRefreshSessionModel.create(
          [
            {
              _id: input.replacement.id,
              familyId: revoked.familyId,
              userId: revoked.userId,
              verifierHash: input.replacement.verifierHash,
              expiresAt: revoked.expiresAt,
              revokedAt: null,
            },
          ],
          { session },
        );
        result = { status: 'rotated', userId: revoked.userId };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async revoke(input: {
    id: string;
    verifierHash: string;
    now: string;
  }): Promise<void> {
    const transaction = await mongoose.startSession();
    try {
      await transaction.withTransaction(async () => {
        const session = await MongoRefreshSessionModel.findById(input.id)
          .session(transaction)
          .lean<RefreshRecord>()
          .exec();
        if (
          !session ||
          !hashesMatch(session.verifierHash, input.verifierHash)
        ) {
          return;
        }
        const revokedAt = new Date(input.now);
        if (session.revokedAt) {
          await MongoRefreshSessionModel.updateMany(
            { familyId: session.familyId, revokedAt: null },
            { $set: { revokedAt } },
            { session: transaction },
          );
          return;
        }
        const update = await MongoRefreshSessionModel.updateOne(
          { _id: input.id, verifierHash: input.verifierHash, revokedAt: null },
          { $set: { revokedAt } },
          { session: transaction },
        ).exec();
        if (update.modifiedCount !== 1) {
          await MongoRefreshSessionModel.updateMany(
            { familyId: session.familyId, revokedAt: null },
            { $set: { revokedAt } },
            { session: transaction },
          );
        }
      });
    } finally {
      await transaction.endSession();
    }
  }
}
