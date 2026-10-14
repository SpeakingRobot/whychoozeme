import { guestProfileVisit } from '../src/guestAccess';

test('guests can revisit three profiles but must sign in to open a fourth', () => {
  const first = guestProfileVisit([], 'a');
  const third = guestProfileVisit(['a', 'b'], 'c');
  expect(first).toEqual({ allowed: true, viewed: ['a'] });
  expect(third).toEqual({ allowed: true, viewed: ['a', 'b', 'c'] });
  expect(guestProfileVisit(third.viewed, 'a').allowed).toBe(true);
  expect(guestProfileVisit(third.viewed, 'd')).toEqual({ allowed: false, viewed: ['a', 'b', 'c'] });
});
