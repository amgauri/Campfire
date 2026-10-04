import type { User } from '../auth/domain.js';

export type PublicProfile = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatarUrl' | 'auraLevel' | 'interests'
>;

export function toPublicProfile(user: User): PublicProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    auraLevel: user.auraLevel,
    interests: [...user.interests],
  };
}
