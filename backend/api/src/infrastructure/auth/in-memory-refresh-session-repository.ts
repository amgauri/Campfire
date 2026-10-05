import { timingSafeEqual } from 'node:crypto';
import type { RefreshSession } from '../../modules/auth/domain.js';
import type {
  RefreshSessionRepository,
  RotateResult,
} from '../../modules/auth/ports.js';

function hashesMatch(expected: string, presented: string): boolean {
  const expectedBytes = Buffer.from(expected, 'hex');
  const presentedBytes = Buffer.from(presented, 'hex');
  return (
    expectedBytes.length === presentedBytes.length &&
    timingSafeEqual(expectedBytes, presentedBytes)
  );
}

export class InMemoryRefreshSessionRepository implements RefreshSessionRepository {
  private readonly sessions = new Map<string, RefreshSession>();

  create(session: RefreshSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
    return Promise.resolve();
  }

  rotate(input: {
    currentId: string;
    verifierHash: string;
    replacement: Pick<RefreshSession, 'id' | 'verifierHash'>;
    now: string;
  }): Promise<RotateResult> {
    const current = this.sessions.get(input.currentId);
    if (!current || !hashesMatch(current.verifierHash, input.verifierHash)) {
      return Promise.resolve({ status: 'invalid' });
    }
    if (current.revokedAt) {
      for (const session of this.sessions.values()) {
        if (session.familyId === current.familyId)
          session.revokedAt = input.now;
      }
      return Promise.resolve({ status: 'reused' });
    }
    if (current.expiresAt <= input.now)
      return Promise.resolve({ status: 'invalid' });

    current.revokedAt = input.now;
    this.sessions.set(input.replacement.id, {
      ...input.replacement,
      familyId: current.familyId,
      userId: current.userId,
      expiresAt: current.expiresAt,
      revokedAt: null,
    });
    return Promise.resolve({ status: 'rotated', userId: current.userId });
  }

  revoke(input: {
    id: string;
    verifierHash: string;
    now: string;
  }): Promise<void> {
    const session = this.sessions.get(input.id);
    if (session && hashesMatch(session.verifierHash, input.verifierHash)) {
      for (const familySession of this.sessions.values()) {
        if (familySession.familyId === session.familyId) {
          familySession.revokedAt = input.now;
        }
      }
    }
    return Promise.resolve();
  }
}
