import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const fail = (message: string, status = 400) => json({ error: message }, status);
const unwrap = (result: { data: any; error: { message: string } | null }) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function profilePatch(kind: 'freelancer' | 'finder', values: unknown): Record<string, unknown> {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Profile values are required.');
  const allowed = kind === 'freelancer'
    ? ['display_name','role_title','category_slug','taluka','locality','why_me','tags','portfolio','image_url']
    : ['display_name','taluka'];
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.includes(key)) throw new Error(`Cannot edit ${key}.`);
    if (key === 'tags' || key === 'portfolio') {
      if (!Array.isArray(value) || value.length > 20 || value.some(item => typeof item !== 'string' || item.length > 160)) throw new Error(`${key} must be a short list of text.`);
      result[key] = value.map(item => item.trim()).filter(Boolean);
    } else if (key === 'image_url') {
      if (value !== null && (typeof value !== 'string' || (value && !/^https:\/\//.test(value)))) throw new Error('Image URL must use HTTPS.');
      result[key] = value;
    } else {
      if (typeof value !== 'string' || value.length > (key === 'why_me' ? 2000 : 160)) throw new Error(`${key} must be text.`);
      result[key] = value.trim();
    }
  }
  if (!Object.keys(result).length) throw new Error('Choose a profile field to change.');
  return result;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return fail('POST required.', 405);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !serviceKey) return fail('Function secrets are missing.', 503);
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return fail('Authentication required.', 401);
  try {
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return fail('Authentication required.', 401);
    if (auth.user.banned_until && Date.parse(auth.user.banned_until) > Date.now()) return fail('Account suspended.', 403);
    const server = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: admin, error: adminError } = await server.from('admins').select('user_id').eq('user_id', auth.user.id).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return fail('Admin role required.', 403);
    const input = await request.json();
    const action = input?.action;

    if (action === 'list') {
      const page = Number(input.page || 1);
      if (!Number.isInteger(page) || page < 1 || page > 10000) return fail('Invalid page.');
      const perPage = 100;
      const authPage = unwrap(await server.auth.admin.listUsers({ page, perPage }));
      const users = authPage.users || [];
      const ids = users.map((user: any) => user.id);
      if (!ids.length) return json({ users: [], page, hasMore: false });
      const [freelancers, finders, contacts, entitlements] = await Promise.all([
        server.from('freelancer_profiles').select('*').in('user_id', ids),
        server.from('finder_profiles').select('*').in('user_id', ids),
        server.from('freelancer_contacts').select('*').in('freelancer_id', ids),
        server.from('user_entitlements').select('user_id,premium').in('user_id', ids),
      ]);
      const byId = (rows: any[], key = 'user_id') => new Map(rows.map(row => [row[key], row]));
      const freelancerById = byId(unwrap(freelancers));
      const finderById = byId(unwrap(finders));
      const contactById = byId(unwrap(contacts), 'freelancer_id');
      const premiumById = byId(unwrap(entitlements));
      return json({ page, hasMore: users.length === perPage, users: users.map((user: any) => ({
        id: user.id, email: user.email, createdAt: user.created_at, confirmedAt: user.email_confirmed_at,
        bannedUntil: user.banned_until, premium: !!premiumById.get(user.id)?.premium,
        freelancer: freelancerById.get(user.id) || null, finder: finderById.get(user.id) || null,
        contact: contactById.get(user.id) || null,
      })) });
    }

    if (!uuid(input?.userId)) return fail('Valid user ID required.');
    const userId = input.userId as string;
    const log = async (event: string, detail: Record<string, unknown>) => {
      const result = await server.from('admin_action_log').insert({ actor_id: auth.user.id, target_id: userId, action: event, detail });
      if (result.error) console.error('Admin action audit failed:', result.error.message);
      return !result.error;
    };

    if (action === 'editProfile') {
      const kind = input.kind;
      if (kind !== 'freelancer' && kind !== 'finder') return fail('Choose freelancer or finder.');
      const values = profilePatch(kind, input.values);
      const table = kind === 'freelancer' ? 'freelancer_profiles' : 'finder_profiles';
      const profile = unwrap(await server.from(table).update(values).eq('user_id', userId).select('*').single());
      const auditRecorded = await log(kind === 'freelancer' ? 'edit_freelancer' : 'edit_finder', { fields: Object.keys(values) });
      return json({ profile, auditRecorded });
    }
    if (action === 'setPremium') {
      if (typeof input.value !== 'boolean') return fail('Premium must be true or false.');
      unwrap(await server.from('user_entitlements').upsert({ user_id: userId, premium: input.value, updated_by: auth.user.id, updated_at: new Date().toISOString() }));
      const auditRecorded = await log(input.value ? 'premium_on' : 'premium_off', {});
      return json({ premium: input.value, auditRecorded });
    }
    if (action === 'setBan') {
      if (typeof input.value !== 'boolean') return fail('Ban must be true or false.');
      if (userId === auth.user.id) return fail('You cannot ban your own account.');
      const { data: targetAdmin, error: targetError } = await server.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
      if (targetError) throw targetError;
      if (targetAdmin) return fail('Admin accounts cannot be banned here.');
      unwrap(await server.auth.admin.updateUserById(userId, { ban_duration: input.value ? '876000h' : 'none' }));
      const auditRecorded = await log(input.value ? 'ban' : 'unban', {});
      return json({ banned: input.value, auditRecorded });
    }
    return fail('Unknown action.');
  } catch (cause) {
    return fail((cause as Error).message || 'Request failed.', 500);
  }
});
