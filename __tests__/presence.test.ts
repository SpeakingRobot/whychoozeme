import { presenceLabel } from '../src/PresenceStatus';

test('shows recent activity as online and older activity as last seen', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  expect(presenceLabel(new Date(now - 90_000).toISOString(), now)).toBe('Online now');
  expect(presenceLabel(new Date(now - 3 * 60_000).toISOString(), now)).toBe('Last seen 3m ago');
  expect(presenceLabel(new Date(now - 26 * 3_600_000).toISOString(), now)).toBe('Last seen 1d ago');
});

test('does not invent presence for missing, invalid, or future activity', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  expect(presenceLabel(undefined, now)).toBeNull();
  expect(presenceLabel('invalid', now)).toBeNull();
  expect(presenceLabel(new Date(now + 5 * 60_000).toISOString(), now)).toBeNull();
});
