const MAX_USERNAME_LENGTH = 32;
export const MAX_USERNAME_ATTEMPTS = 10_000;

export function usernameCandidate(
  normalizedEmail: string,
  attempt: number,
): string {
  const localPart = normalizedEmail.split('@', 1)[0] ?? '';
  const base =
    localPart
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24)
      .replace(/_+$/g, '') || 'user';
  if (attempt === 1) return base;
  const suffix = `_${attempt}`;
  return `${base.slice(0, MAX_USERNAME_LENGTH - suffix.length).replace(/_+$/g, '')}${suffix}`;
}
