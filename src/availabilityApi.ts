import { db } from './liveApi';
import { DateRange } from './booking';

export type LeaveBlock = { id: string; start: string; end: string };
const client = () => { if (!db) throw new Error('Supabase is not configured.'); return db; };
const checked = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
const kolkataDay = (value: Date | string): string => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export async function publicBusyDays(freelancerId: string): Promise<DateRange[]> {
  const now = new Date();
  const start = kolkataDay(now);
  const [year, month] = start.split('-').map(Number);
  const end = new Date(Date.UTC(year, month + 6, 0)).toISOString().slice(0, 10);
  const { data, error } = await client().rpc('public_calendar_busy', { p_freelancer: freelancerId, p_start: start, p_end: end });
  checked(error);
  return (data || []).map((row: any) => ({ start: row.start_day, end: row.end_day }));
}

export async function ownLeaveBlocks(freelancerId: string): Promise<LeaveBlock[]> {
  const { data, error } = await client().from('availability_exceptions').select('id,starts_at,ends_at')
    .eq('freelancer_id', freelancerId).eq('kind', 'leave').order('starts_at');
  checked(error);
  return (data || []).map(row => ({ id: row.id, start: kolkataDay(row.starts_at),
    end: kolkataDay(new Date(new Date(row.ends_at).getTime() - 1)) }));
}

export async function addLeaveBlock(freelancerId: string, range: DateRange): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.start) || !/^\d{4}-\d{2}-\d{2}$/.test(range.end) || range.end < range.start) throw new Error('Invalid dates.');
  checked((await client().from('availability_exceptions').insert({ freelancer_id: freelancerId,
    starts_at: `${range.start}T00:00:00+05:30`,
    ends_at: new Date(Date.parse(`${range.end}T00:00:00+05:30`) + 86400000).toISOString(),
    kind: 'leave' })).error);
}

export async function removeLeaveBlock(id: string): Promise<void> {
  checked((await client().from('availability_exceptions').delete().eq('id', id)).error);
}
