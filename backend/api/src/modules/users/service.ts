import { toPublicUser, type PublicUser } from '../auth/domain.js';
import type { Clock, UserRepository } from '../auth/ports.js';
import { toPublicProfile, type PublicProfile } from './domain.js';
import type { UpdateProfileInput } from './validation.js';

export class UserProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async getOwn(userId: string): Promise<PublicUser | null> {
    const user = await this.users.findById(userId);
    return user ? toPublicUser(user) : null;
  }

  async getPublic(userId: string): Promise<PublicProfile | null> {
    const user = await this.users.findById(userId);
    return user ? toPublicProfile(user) : null;
  }

  async updateOwn(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<PublicUser | null> {
    const user = await this.users.updateDisplayName(
      userId,
      input.displayName,
      this.clock.now().toISOString(),
    );
    return user ? toPublicUser(user) : null;
  }
}
