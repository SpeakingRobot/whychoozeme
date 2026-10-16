import { billableMinor, estimatePrice, intervalsOverlap, pricingModelRegistry, pricingModels, validateTerms, weeklyCapacityRemaining, ProposalTerms } from '../src/hiring';

const base: ProposalTerms = { title: 'Logo design', scope: 'Create a new logo and source artwork', model: 'fixed', currency: 'INR', rateMinor: 200000, timezone: 'Asia/Kolkata', location: 'remote', availabilityMode: 'capacity', deliverables: ['SVG'] };

test('one freelancer can price distinct services independently', () => {
  expect(pricingModels).toHaveLength(18);
  expect(Object.keys(pricingModelRegistry).sort()).toEqual([...pricingModels].sort());
  expect(estimatePrice(base)).toMatchObject({ kind: 'fixed', amountMinor: 200000 });
  expect(estimatePrice({ ...base, model: 'hourly', rateMinor: 60000, estimatedHours: 3, weeklyHourCap: 20, totalCapMinor: 1200000 })).toMatchObject({ kind: 'cap', amountMinor: 1200000 });
  expect(estimatePrice({ ...base, model: 'monthly', rateMinor: 1500000 })).toMatchObject({ kind: 'recurring', amountMinor: 1500000 });
});

test('capacity projects overlap calendar dates while using weekly effort', () => {
  expect(weeklyCapacityRemaining(30, [6, 8, 4])).toBe(12);
  expect(validateTerms(base)).toEqual([]);
  expect(validateTerms({ ...base, availabilityMode: 'exclusive' })).toContain('Reserved work requires exact start and end times.');
});

test('exclusive intervals only collide when actual time overlaps', () => {
  const first = { startAt: '2026-10-20T10:00:00+05:30', endAt: '2026-10-20T11:00:00+05:30' };
  expect(intervalsOverlap(first, { startAt: '2026-10-20T10:30:00+05:30', endAt: '2026-10-20T11:30:00+05:30' })).toBe(true);
  expect(intervalsOverlap(first, { startAt: '2026-10-20T11:00:00+05:30', endAt: '2026-10-20T12:00:00+05:30' })).toBe(false);
});

test('hourly exposure is capped, not paid automatically', () => {
  expect(billableMinor(60000, 180, 1200000)).toBe(180000);
  expect(billableMinor(60000, 1800, 1200000)).toBe(1200000);
});

test('conditional compensation needs explicit basis', () => {
  expect(validateTerms({ ...base, model: 'commission' })).toContain('Describe the payment trigger and calculation.');
});

test('milestone total comes from explicit accepted stages', () => {
  const stages = [
    { title: 'First draft', amountMinor: 40000, acceptanceCriteria: 'Finder approves the draft' },
    { title: 'Final files', amountMinor: 60000, acceptanceCriteria: 'Finder approves the final files' },
  ];
  const terms = { ...base, model: 'milestone' as const, rateMinor: undefined, milestones: stages };
  expect(validateTerms(terms)).toEqual([]);
  expect(estimatePrice(terms)).toMatchObject({ kind: 'fixed', amountMinor: 100000 });
  expect(validateTerms({ ...terms, milestones: [{ ...stages[0], amountMinor: undefined }] })).toContain('Add 1–20 milestones with a title, positive payment amount, and acceptance criteria.');
  expect(validateTerms({ ...terms, milestones: [] })).toContain('Add 1–20 milestones with a title, positive payment amount, and acceptance criteria.');
});
