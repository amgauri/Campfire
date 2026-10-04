import { timingSafeEqual } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import type { RefreshSession } from '../../modules/auth/domain.js';
import type {
  RefreshSessionRepository,
  RotateResult,
} from '../../modules/auth/ports.js';

type SessionDoc = {
  _id: string;
  familyId: string;
  userId: string;
  verifierHash: string;
  expiresAt: string;
  revokedAt: string | null;
};

const sessionSchema = new Schema<SessionDoc>(
  {
    _id: { type: String, required: true },
    familyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    verifierHash: { type: String, required: true },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String, default: null },
  },
  { versionKey: false, collection: 'auth_refresh_sessions' },
);

const SessionModel = mongoose.model<SessionDoc>('AuthRefreshSession', sessionSchema);

function hashesMatch(expected: string, presented: string): boolean {
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(presented, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export class MongoRefreshSessionRepository implements RefreshSessionRepository {
  async create(session: RefreshSession): Promise<void> {
    await SessionModel.create({
      _id: session.id,
      familyId: session.familyId,
      userId: session.userId,
      verifierHash: session.verifierHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    });
  }

  async rotate(input: {
    currentId: string;
    verifierHash: string;
    replacement: Pick<RefreshSession, 'id' | 'verifierHash'>;
    now: string;
  }): Promise<RotateResult> {
    const current = await SessionModel.findById(input.currentId).lean<SessionDoc>();
    if (!current || !hashesMatch(current.verifierHash, input.verifierHash)) {
      return { status: 'invalid' };
    }

    const revokeFamily = () =>
      SessionModel.updateMany(
        { familyId: current.familyId, revokedAt: null },
        { $set: { revokedAt: input.now } },
      );

    if (current.revokedAt) {
      await revokeFamily();
      return { status: 'reused' };
    }
    if (current.expiresAt <= input.now) return { status: 'invalid' };

    // Atomic claim: only one concurrent request can revoke this session.
    const claimed = await SessionModel.updateOne(
      { _id: input.currentId, revokedAt: null },
      { $set: { revokedAt: input.now } },
    );
    if (claimed.modifiedCount === 0) {
      await revokeFamily();
      return { status: 'reused' };
    }

    await SessionModel.create({
      _id: input.replacement.id,
      familyId: current.familyId,
      userId: current.userId,
      verifierHash: input.replacement.verifierHash,
      expiresAt: current.expiresAt,
      revokedAt: null,
    });
    return { status: 'rotated', userId: current.userId };
  }

  async revoke(input: {
    id: string;
    verifierHash: string;
    now: string;
  }): Promise<void> {
    const session = await SessionModel.findById(input.id).lean<SessionDoc>();
    if (session && hashesMatch(session.verifierHash, input.verifierHash)) {
      await SessionModel.updateOne(
        { _id: input.id },
        { $set: { revokedAt: input.now } },
      );
    }
  }
}