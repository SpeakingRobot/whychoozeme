import { inquiryValidationError, InquiryDraft } from '../src/inquiryValidation';

const valid: InquiryDraft = { title: 'Brand photographs', requirements: 'Photograph our new café menu and team.', work_mode: 'in_person' };
const image = { type: 'image/jpeg', size: 1024 };
const check = (change: Partial<InquiryDraft>, files = [image]) => inquiryValidationError({ ...valid, ...change }, files);

describe('project inquiry validation', () => {
  test('accepts a complete inquiry with references', () => expect(check({})).toBeNull());
  test('accepts optional dates and budget', () => expect(check({ preferred_start: '2026-12-03', preferred_end: '2026-12-07', budget_note: '₹10,000' })).toBeNull());
  test('requires a useful title', () => expect(check({ title: ' Hi ' })).toMatch(/title/));
  test('requires meaningful requirements', () => expect(check({ requirements: 'Short' })).toMatch(/requirements/));
  test('rejects oversized text', () => expect(check({ requirements: 'x'.repeat(4001) })).toMatch(/too long/));
  test('rejects oversized budget note', () => expect(check({ budget_note: 'x'.repeat(301) })).toMatch(/too long/));
  test('rejects invalid work modes', () => expect(check({ work_mode: 'elsewhere' as InquiryDraft['work_mode'] })).toMatch(/Choose/));
  test('rejects malformed dates', () => expect(check({ preferred_start: '03/12/2026' })).toMatch(/start date/));
  test('rejects impossible calendar dates', () => expect(check({ preferred_start: '2026-02-30' })).toMatch(/start date/));
  test('rejects end before start', () => expect(check({ preferred_start: '2026-12-07', preferred_end: '2026-12-03' })).toMatch(/end date/));
  test('allows five references', () => expect(check({}, Array(5).fill(image))).toBeNull());
  test('rejects six references', () => expect(check({}, Array(6).fill(image))).toMatch(/five/));
  test('rejects HTML masquerading as an image', () => expect(check({}, [{ type: 'text/html', size: 1024 }])).toMatch(/JPEG/));
  test('rejects empty references', () => expect(check({}, [{ type: 'image/png', size: 0 }])).toMatch(/JPEG/));
  test('rejects references over 5 MB', () => expect(check({}, [{ type: 'image/webp', size: 5 * 1024 * 1024 + 1 }])).toMatch(/5 MB/));
});
