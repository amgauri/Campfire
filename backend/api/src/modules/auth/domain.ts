export type Role = 'user' | 'admin';
export type AuraLevel = 0 | 1 | 2 | 3;

export type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  auraLevel: AuraLevel;
  interests: string[];
  onboardingComplete: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Pick<
  User,
  | 'id'
  | 'username'
  | 'displayName'
  | 'email'
  | 'avatarUrl'
  | 'auraLevel'
  | 'interests'
  | 'onboardingComplete'
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    auraLevel: user.auraLevel,
    interests: [...user.interests],
    onboardingComplete: user.onboardingComplete,
  };
}

export type RefreshSession = {
  id: string;
  familyId: string;
  userId: string;
  verifierHash: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type AuthContext = {
  userId: string;
  role: Role;
};
