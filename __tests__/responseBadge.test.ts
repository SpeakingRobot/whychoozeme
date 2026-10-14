import { responseDuration, responseTier } from '../src/ResponseBadge';

test('response pace uses the requested fast, half-hour and hour thresholds', () => {
  expect(responseTier(5)?.label).toBe('Very fast');
  expect(responseTier(15)?.label).toBe('Very fast');
  expect(responseTier(30)?.label).toBe('Fast');
  expect(responseTier(60)?.label).toBe('Moderate');
  expect(responseTier(180)?.label).toBe('Typical');
  expect(responseTier(undefined)).toBeNull();
});

test('response duration remains readable for minutes, hours, and days', () => {
  expect(responseDuration(12)).toBe('12m');
  expect(responseDuration(120)).toBe('2h');
  expect(responseDuration(2880)).toBe('2d');
});
