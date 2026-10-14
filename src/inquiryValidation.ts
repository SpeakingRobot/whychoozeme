export type InquiryDraft = {
  title: string; requirements: string; work_mode: 'remote' | 'in_person' | 'either';
  preferred_start?: string; preferred_end?: string; budget_note?: string;
};

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
};

export function inquiryValidationError(input: InquiryDraft, files: { type: string; size: number }[]): string | null {
  const title = input.title.trim(), requirements = input.requirements.trim();
  if (title.length < 4 || requirements.length < 10) return 'Add a title and at least 10 characters of requirements.';
  if (title.length > 140 || requirements.length > 4000 || (input.budget_note?.length || 0) > 300) return 'One of the inquiry fields is too long.';
  if (!['remote', 'in_person', 'either'].includes(input.work_mode)) return 'Choose how the work can happen.';
  if (input.preferred_start && !validDate(input.preferred_start)) return 'Use a valid YYYY-MM-DD start date.';
  if (input.preferred_end && !validDate(input.preferred_end)) return 'Use a valid YYYY-MM-DD end date.';
  if (input.preferred_start && input.preferred_end && input.preferred_end < input.preferred_start) return 'The end date must follow the start date.';
  if (files.length > 5) return 'Add up to five reference images.';
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024)) return 'Reference images must be JPEG, PNG or WebP and at most 5 MB each.';
  return null;
}
