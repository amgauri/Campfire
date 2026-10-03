import type { AuthContext, RefreshSession, User } from './domain.js';

export interface UserRepository {
  create(
    user: User,
  ): Promise<'created' | 'email_conflict' | 'username_conflict'>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateOnboarding(
    userId: string,
    interests: string[],
    updatedAt: string,
  ): Promise<User | null>;
}

export type RotateResult =
  { status: 'rotated'; userId: string } | { status: 'invalid' | 'reused' };

export interface RefreshSessionRepository {
  create(session: RefreshSession): Promise<void>;
  rotate(input: {
    currentId: string;
    verifierHash: string;
    replacement: Pick<RefreshSession, 'id' | 'verifierHash'>;
    now: string;
  }): Promise<RotateResult>;
  revoke(input: {
    id: string;
    verifierHash: string;
    now: string;
  }): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export interface AccessTokenProvider {
  issue(identity: AuthContext): Promise<string>;
  verify(token: string): Promise<AuthContext>;
}

export interface Clock {
  now(): Date;
}
