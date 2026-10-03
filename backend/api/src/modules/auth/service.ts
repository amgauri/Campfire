import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PublicUser, RefreshSession, User } from './domain.js';
import { toPublicUser } from './domain.js';
import { AuthFailure } from './errors.js';
import type {
  AccessTokenProvider,
  Clock,
  PasswordHasher,
  RefreshSessionRepository,
  UserRepository,
} from './ports.js';
import { MAX_USERNAME_ATTEMPTS, usernameCandidate } from './username.js';
import type {
  LoginInput,
  OnboardingInput,
  RegisterInput,
} from './validation.js';

export type AuthSessionResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RefreshResponse = Omit<AuthSessionResponse, 'user'>;

function newRefreshToken(): {
  id: string;
  token: string;
  verifierHash: string;
} {
  const id = randomUUID();
  const secret = randomBytes(32).toString('base64url');
  return {
    id,
    token: `${id}.${secret}`,
    verifierHash: createHash('sha256').update(secret).digest('hex'),
  };
}

function parseRefreshToken(token: string): {
  id: string;
  verifierHash: string;
} {
  const match =
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/.exec(
      token,
    );
  if (!match?.[1] || !match[2]) {
    throw new AuthFailure('INVALID_REFRESH_TOKEN');
  }
  return {
    id: match[1],
    verifierHash: createHash('sha256').update(match[2]).digest('hex'),
  };
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshSessions: RefreshSessionRepository,
    private readonly passwords: PasswordHasher,
    private readonly accessTokens: AccessTokenProvider,
    private readonly clock: Clock,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlDays: number,
  ) {}

  async register(input: RegisterInput): Promise<AuthSessionResponse> {
    const now = this.clock.now().toISOString();
    const user: User = {
      id: randomUUID(),
      username: '',
      email: input.email.trim().toLowerCase(),
      passwordHash: await this.passwords.hash(input.password),
      displayName: input.displayName,
      avatarUrl: null,
      auraLevel: 0,
      interests: [],
      onboardingComplete: false,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    };
    for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt += 1) {
      user.username = usernameCandidate(user.email, attempt);
      const result = await this.users.create(user);
      if (result === 'created') return this.createSession(user);
      if (result === 'email_conflict') throw new AuthFailure('EMAIL_IN_USE');
    }
    throw new AuthFailure('USERNAME_UNAVAILABLE');
  }

  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (
      !user ||
      !(await this.passwords.verify(user.passwordHash, input.password))
    ) {
      throw new AuthFailure('INVALID_CREDENTIALS');
    }
    return this.createSession(user);
  }

  async refresh(token: string): Promise<RefreshResponse> {
    const current = parseRefreshToken(token);
    const next = newRefreshToken();
    const now = this.clock.now();
    const result = await this.refreshSessions.rotate({
      currentId: current.id,
      verifierHash: current.verifierHash,
      replacement: {
        id: next.id,
        verifierHash: next.verifierHash,
      },
      now: now.toISOString(),
    });
    if (result.status !== 'rotated') {
      throw new AuthFailure('INVALID_REFRESH_TOKEN');
    }
    const user = await this.users.findById(result.userId);
    if (!user) {
      throw new AuthFailure('INVALID_REFRESH_TOKEN');
    }
    return {
      accessToken: await this.accessTokens.issue({
        userId: user.id,
        role: user.role,
      }),
      refreshToken: next.token,
      expiresIn: this.accessTtlSeconds,
    };
  }

  async logout(token: string): Promise<void> {
    const parsed = parseRefreshToken(token);
    await this.refreshSessions.revoke({
      id: parsed.id,
      verifierHash: parsed.verifierHash,
      now: this.clock.now().toISOString(),
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new AuthFailure('UNAUTHENTICATED');
    return toPublicUser(user);
  }

  async completeOnboarding(
    userId: string,
    input: OnboardingInput,
  ): Promise<PublicUser> {
    const seen = new Set<string>();
    const interests = input.interests.filter((interest) => {
      const key = interest.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const user = await this.users.updateOnboarding(
      userId,
      interests,
      this.clock.now().toISOString(),
    );
    if (!user) throw new AuthFailure('UNAUTHENTICATED');
    return toPublicUser(user);
  }

  private async createSession(user: User): Promise<AuthSessionResponse> {
    const refresh = newRefreshToken();
    const now = this.clock.now();
    const session: RefreshSession = {
      id: refresh.id,
      familyId: randomUUID(),
      userId: user.id,
      verifierHash: refresh.verifierHash,
      expiresAt: new Date(
        now.getTime() + this.refreshTtlDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      revokedAt: null,
    };
    await this.refreshSessions.create(session);
    return {
      user: toPublicUser(user),
      accessToken: await this.accessTokens.issue({
        userId: user.id,
        role: user.role,
      }),
      refreshToken: refresh.token,
      expiresIn: this.accessTtlSeconds,
    };
  }
}
