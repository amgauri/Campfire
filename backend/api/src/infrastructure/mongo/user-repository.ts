import type { User } from '../../modules/auth/domain.js';
import type { UserRepository } from '../../modules/auth/ports.js';
import { MongoUserModel } from './models.js';

type UserRecord = {
  _id: string;
  email: string;
  emailKey: string;
  username: string;
  usernameKey: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  auraLevel: User['auraLevel'];
  interests: string[];
  onboardingComplete: boolean;
  role: User['role'];
  createdAt: Date;
  updatedAt: Date;
};

function toUser(record: UserRecord): User {
  return {
    id: record._id,
    email: record.email,
    username: record.username,
    passwordHash: record.passwordHash,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    auraLevel: record.auraLevel,
    interests: [...record.interests],
    onboardingComplete: record.onboardingComplete,
    role: record.role,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function duplicateKey(error: unknown): string | null {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    error.code !== 11000
  ) {
    return null;
  }
  if ('keyPattern' in error && typeof error.keyPattern === 'object') {
    const pattern = error.keyPattern as Record<string, unknown>;
    if ('emailKey' in pattern) return 'email';
    if ('usernameKey' in pattern) return 'username';
  }
  return 'unknown';
}

export class MongoUserRepository implements UserRepository {
  async create(
    user: User,
  ): Promise<'created' | 'email_conflict' | 'username_conflict'> {
    try {
      await MongoUserModel.create({
        _id: user.id,
        email: user.email,
        emailKey: user.email.toLowerCase(),
        username: user.username,
        usernameKey: user.username.toLowerCase(),
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        auraLevel: user.auraLevel,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete,
        role: user.role,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      });
      return 'created';
    } catch (error) {
      const key = duplicateKey(error);
      if (key === 'email') return 'email_conflict';
      if (key === 'username') return 'username_conflict';
      if (key) {
        const [email, username] = await Promise.all([
          MongoUserModel.exists({ emailKey: user.email.toLowerCase() }),
          MongoUserModel.exists({ usernameKey: user.username.toLowerCase() }),
        ]);
        if (email) return 'email_conflict';
        if (username) return 'username_conflict';
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await MongoUserModel.findOne({
      emailKey: email.toLowerCase(),
    })
      .lean<UserRecord>()
      .exec();
    return record ? toUser(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await MongoUserModel.findById(id).lean<UserRecord>().exec();
    return record ? toUser(record) : null;
  }

  async updateOnboarding(
    userId: string,
    interests: string[],
    updatedAt: string,
  ): Promise<User | null> {
    const record = await MongoUserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          interests: [...interests],
          onboardingComplete: true,
          updatedAt: new Date(updatedAt),
        },
      },
      { returnDocument: 'after', runValidators: true },
    )
      .lean<UserRecord>()
      .exec();
    return record ? toUser(record) : null;
  }

  async updateDisplayName(
    userId: string,
    displayName: string,
    updatedAt: string,
  ): Promise<User | null> {
    const record = await MongoUserModel.findByIdAndUpdate(
      userId,
      { $set: { displayName, updatedAt: new Date(updatedAt) } },
      { returnDocument: 'after', runValidators: true },
    )
      .lean<UserRecord>()
      .exec();
    return record ? toUser(record) : null;
  }
}
