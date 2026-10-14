import { addDays, inRange, isoDay, overlaps } from '../src/booking';

describe('availability dates', () => {
  it('finds bookings across a selected range and keeps date math across months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(overlaps({ start: '2026-10-14', end: '2026-10-16' }, { start: '2026-10-16', end: '2026-10-18' })).toBe(true);
    expect(overlaps({ start: '2026-10-14', end: '2026-10-16' }, { start: '2026-10-17', end: '2026-10-18' })).toBe(false);
    expect(inRange('2026-10-15', { start: '2026-10-14', end: '2026-10-16' })).toBe(true);
    expect(isoDay(new Date(2026, 9, 13))).toBe('2026-10-13');
  });
});
