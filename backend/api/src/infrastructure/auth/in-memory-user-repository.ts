import type { User } from '../../modules/auth/domain.js';
import type { UserRepository } from '../../modules/auth/ports.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();
  private readonly idByEmail = new Map<string, string>();
  private readonly idByUsername = new Map<string, string>();

  create(
    user: User,
  ): Promise<'created' | 'email_conflict' | 'username_conflict'> {
    const emailKey = user.email.toLowerCase();
    const usernameKey = user.username.toLowerCase();
    if (this.idByEmail.has(emailKey)) return Promise.resolve('email_conflict');
    if (this.idByUsername.has(usernameKey))
      return Promise.resolve('username_conflict');
    this.byId.set(user.id, { ...user, interests: [...user.interests] });
    this.idByEmail.set(emailKey, user.id);
    this.idByUsername.set(usernameKey, user.id);
    return Promise.resolve('created');
  }

  findByEmail(email: string): Promise<User | null> {
    const id = this.idByEmail.get(email.toLowerCase());
    const user = id ? this.byId.get(id) : undefined;
    return Promise.resolve(
      user ? { ...user, interests: [...user.interests] } : null,
    );
  }

  findById(id: string): Promise<User | null> {
    const user = this.byId.get(id);
    return Promise.resolve(
      user ? { ...user, interests: [...user.interests] } : null,
    );
  }

  updateOnboarding(
    userId: string,
    interests: string[],
    updatedAt: string,
  ): Promise<User | null> {
    const user = this.byId.get(userId);
    if (!user) return Promise.resolve(null);
    const updated: User = {
      ...user,
      interests: [...interests],
      onboardingComplete: true,
      updatedAt,
    };
    this.byId.set(userId, updated);
    return Promise.resolve({ ...updated, interests: [...updated.interests] });
  }

  updateDisplayName(
    userId: string,
    displayName: string,
    updatedAt: string,
  ): Promise<User | null> {
    const user = this.byId.get(userId);
    if (!user) return Promise.resolve(null);
    const updated: User = { ...user, displayName, updatedAt };
    this.byId.set(userId, updated);
    return Promise.resolve({ ...updated, interests: [...updated.interests] });
  }
}
