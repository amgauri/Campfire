import mongoose, { Schema } from 'mongoose';
import type { AuraLevel, Role, User } from '../../modules/auth/domain.js';
import type { UserRepository } from '../../modules/auth/ports.js';

type UserDoc = {
  _id: string;
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  auraLevel: number;
  interests: string[];
  onboardingComplete: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    usernameLower: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    emailLower: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    auraLevel: { type: Number, default: 0 },
    interests: { type: [String], default: [] },
    onboardingComplete: { type: Boolean, default: false },
    role: { type: String, default: 'user' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false, collection: 'auth_users' },
);

const UserModel = mongoose.model<UserDoc>('AuthUser', userSchema);

function toUser(doc: UserDoc): User {
  return {
    id: doc._id,
    username: doc.username,
    email: doc.email,
    passwordHash: doc.passwordHash,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
    auraLevel: doc.auraLevel as AuraLevel,
    interests: [...doc.interests],
    onboardingComplete: doc.onboardingComplete,
    role: doc.role as Role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoUserRepository implements UserRepository {
  async create(
    user: User,
  ): Promise<'created' | 'email_conflict' | 'username_conflict'> {
    try {
      await UserModel.create({
        _id: user.id,
        username: user.username,
        usernameLower: user.username.toLowerCase(),
        email: user.email,
        emailLower: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        auraLevel: user.auraLevel,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      return 'created';
    } catch (error) {
      const e = error as { code?: number; keyPattern?: Record<string, unknown> };
      if (e.code === 11000) {
        if (e.keyPattern && 'usernameLower' in e.keyPattern) {
          return 'username_conflict';
        }
        return 'email_conflict';
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      emailLower: email.toLowerCase(),
    }).lean<UserDoc>();
    return doc ? toUser(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDoc>();
    return doc ? toUser(doc) : null;
  }

  async updateOnboarding(
    userId: string,
    interests: string[],
    updatedAt: string,
  ): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { interests, onboardingComplete: true, updatedAt } },
      { new: true },
    ).lean<UserDoc>();
    return doc ? toUser(doc) : null;
  }
}