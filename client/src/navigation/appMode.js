// Day/Night is a PRODUCT mode derived from where the user is in the route tree.
// Not the clock, not the OS theme.
export function deriveAppMode(segments) {
  const inSurgeFlow = segments.includes('(surge)');
  const onSurgeTab = segments.includes('(tabs)') && segments.includes('surge');
  return inSurgeFlow || onSurgeTab ? 'night' : 'day';
}