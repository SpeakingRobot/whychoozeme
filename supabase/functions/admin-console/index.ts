import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { corsHeaders as cors } from 'npm:@supabase/supabase-js@2.117.3/cors';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const fail = (message: string, status = 400) => json({ error: message }, status);
const unwrap = (result: { data: any; error: { message: string } | null }) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function removeUserFiles(server: any, userId: string) {
  const removeFolder = async (bucket: string, prefix: string): Promise<void> => {
    const { data, error } = await server.storage.from(bucket).list(prefix, { limit: 100 });
    if (error) throw error;
    if (!data?.length) return;
    const files = data.filter((item: any) => item.id).map((item: any) => `${prefix}/${item.name}`);
    for (const folder of data.filter((item: any) => !item.id)) await removeFolder(bucket, `${prefix}/${folder.name}`);
    if (files.length) unwrap(await server.storage.from(bucket).remove(files));
    if (data.length === 100) await removeFolder(bucket, prefix);
  };
  for (const bucket of ['portfolio-public', 'inquiry-private', 'agreement-private', 'chat-private']) await removeFolder(bucket, userId);
}

async function deleteTestUser(server: any, userId: string) {
  const hiring = unwrap(await server.from('hiring_requests').select('id').or(`finder_id.eq.${userId},freelancer_id.eq.${userId}`).limit(1));
  if (hiring.length) throw new Error('This account has hiring or agreement history and cannot be deleted from the test-account tool.');
  // Storage objects must be removed through Storage, not deleted from storage.objects with SQL.
  const conversations = unwrap(await server.from('chat_messages').select('id').or(`finder_id.eq.${userId},freelancer_id.eq.${userId}`));
  for (let offset = 0; offset < conversations.length; offset += 100) {
    const attachments = unwrap(await server.from('chat_attachments').select('storage_path').in('message_id', conversations.slice(offset, offset + 100).map((row: any) => row.id)));
    const paths = attachments.map((row: any) => row.storage_path);
    if (paths.length) unwrap(await server.storage.from('chat-private').remove(paths));
  }
  await removeUserFiles(server, userId);
  unwrap(await server.from('inquiry_attachments').delete().eq('uploaded_by', userId));
  unwrap(await server.from('signature_assets').delete().eq('user_id', userId));
  unwrap(await server.from('availability_rules').delete().eq('freelancer_id', userId));
  unwrap(await server.from('availability_exceptions').delete().eq('freelancer_id', userId));
  const services = unwrap(await server.from('service_listings').select('id').eq('freelancer_id', userId));
  if (services.length) unwrap(await server.from('service_pricing').delete().in('service_id', services.map((item: any) => item.id)));
  unwrap(await server.from('service_listings').delete().eq('freelancer_id', userId));
  unwrap(await server.from('work_preferences').delete().eq('freelancer_id', userId));
  const result = await server.auth.admin.deleteUser(userId, false);
  if (result.error) throw result.error;
}

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
    if (action === 'detail') {
      const [services, media, requests, flags] = await Promise.all([
        server.from('service_listings').select('id,title,description,category_slug,active,created_at').eq('freelancer_id', userId).order('created_at', { ascending: false }),
        server.from('portfolio_media').select('id,kind,file_name,storage_path,created_at').eq('freelancer_id', userId).order('created_at', { ascending: false }),
        server.from('requests').select('id,title,details,status,created_at').eq('finder_id', userId).order('created_at', { ascending: false }),
        server.from('admin_flags').select('id,reason,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      return json({ services: unwrap(services), media: unwrap(media), requests: unwrap(requests), flags: unwrap(flags) });
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
    if (action === 'flagUser') {
      const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
      if (reason.length < 10 || reason.length > 500) return fail('Give a reason of 10–500 characters.');
      if (userId === auth.user.id) return fail('You cannot flag your own account.');
      const { data: targetAdmin, error: targetError } = await server.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
      if (targetError) throw targetError;
      if (targetAdmin) return fail('Admin accounts cannot be flagged here.');
      const flag = unwrap(await server.from('admin_flags').insert({ user_id: userId, admin_id: auth.user.id, reason }).select('id').single());
      unwrap(await server.from('notifications').insert({ user_id: userId, kind: 'admin_flag', title: `An admin flagged your account: ${reason}`, related_id: flag.id }));
      const auditRecorded = await log('flag', { flagId: flag.id, reason });
      return json({ flagId: flag.id, auditRecorded });
    }
    if (action === 'removeContent') {
      if (!uuid(input.itemId)) return fail('Valid listing ID required.');
      const itemId = input.itemId as string;
      if (input.kind === 'service') {
        const item = unwrap(await server.from('service_listings').select('id').eq('id', itemId).eq('freelancer_id', userId).maybeSingle());
        if (!item) return fail('Service not found.', 404);
        const linked = unwrap(await server.from('hiring_requests').select('id').eq('service_id', itemId).limit(1));
        if (linked.length) return fail('This service has hiring history and cannot be deleted.', 409);
        unwrap(await server.from('availability_rules').delete().eq('service_id', itemId));
        unwrap(await server.from('service_pricing').delete().eq('service_id', itemId));
        unwrap(await server.from('service_listings').delete().eq('id', itemId));
        return json({ removed: true, auditRecorded: await log('remove_service', { itemId }) });
      }
      if (input.kind === 'media') {
        const item = unwrap(await server.from('portfolio_media').select('id,storage_path').eq('id', itemId).eq('freelancer_id', userId).maybeSingle());
        if (!item) return fail('Media not found.', 404);
        unwrap(await server.storage.from('portfolio-public').remove([item.storage_path]));
        unwrap(await server.from('portfolio_media').delete().eq('id', itemId));
        return json({ removed: true, auditRecorded: await log('remove_media', { itemId }) });
      }
      if (input.kind === 'request') {
        const item = unwrap(await server.from('requests').select('id').eq('id', itemId).eq('finder_id', userId).maybeSingle());
        if (!item) return fail('Request not found.', 404);
        unwrap(await server.from('requests').delete().eq('id', itemId));
        return json({ removed: true, auditRecorded: await log('remove_request', { itemId }) });
      }
      return fail('Unsupported listing type.');
    }
    if (action === 'deleteUser') {
      if (userId === auth.user.id) return fail('You cannot delete your own admin account.');
      const { data: targetAdmin, error: targetError } = await server.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
      if (targetError) throw targetError;
      if (targetAdmin) return fail('Admin accounts cannot be deleted here.');
      const { data: target, error: userError } = await server.auth.admin.getUserById(userId);
      if (userError || !target.user) return fail('Account not found.', 404);
      const auditRecorded = await log('delete_attempt', { userId, email: target.user.email || null });
      if (!auditRecorded) return fail('Could not record the deletion audit. No account was deleted.', 500);
      await deleteTestUser(server, userId);
      const audit = await server.from('admin_action_log').insert({ actor_id: auth.user.id, target_id: null, action: 'delete_user', detail: { deletedUserId: userId, email: target.user.email || null } });
      if (audit.error) console.error('Admin deletion audit failed:', audit.error.message);
      return json({ deleted: true, auditRecorded: !audit.error });
    }
    return fail('Unknown action.');
  } catch (cause) {
    return fail((cause as Error).message || 'Request failed.', 500);
  }
});
