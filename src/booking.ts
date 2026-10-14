export type DateRange = { start: string; end: string };
export type BookingRequest = DateRange & {
  id: string;
  freelancerId: string;
  freelancerName: string;
  note: string;
  reply: string;
  status: 'pending' | 'accepted' | 'declined';
};

export const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const addDays = (day: string, count: number) => {
  const [year, month, date] = day.split('-').map(Number);
  return isoDay(new Date(year, month - 1, date + count));
};
export const overlaps = (a: DateRange, b: DateRange) => a.start <= b.end && b.start <= a.end;
export const inRange = (day: string, range: DateRange) => range.start <= day && day <= range.end;
export const readableDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
