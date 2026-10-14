import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Category, Freelancer, RequestPost, talukaCenters, Taluka } from './data';
import { liveEnabled, supabasePublishableKey, supabaseUrl } from './supabaseConfig';

export const db: SupabaseClient | null = liveEnabled ? createClient(supabaseUrl, supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web', ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }) },
}) : null;

function assertDb() { if (!db) throw new Error('Supabase project settings are missing.'); return db; }
function unwrap<T>(result: { data?: T; error: { message: string } | null }): T { if (result.error) throw new Error(result.error.message); return result.data as T; }

export async function account() { const result = await assertDb().auth.getUser(); if (result.error?.name === 'AuthSessionMissingError') return { user: null }; if (result.error) throw new Error(result.error.message); return result.data; }
export async function signUpFinder(email: string, password: string, name: string, taluka: Taluka) {
  const client = assertDb();
  const data = unwrap(await client.auth.signUp({ email, password, options: { data: { display_name: name, taluka },
    ...(Platform.OS === 'web' ? { emailRedirectTo: globalThis.location.origin } : {}) } }));
  if (data.session && data.user) await saveFinder(data.user.id, name, taluka);
  return !!data.session;
}
export async function signIn(email: string, password: string) { const result = await assertDb().auth.signInWithPassword({ email, password }); if (result.error) throw new Error(result.error.message); return result.data; }
export async function sendPasswordReset(email: string) {
  const result = await assertDb().auth.resetPasswordForEmail(email, Platform.OS === 'web' ? { redirectTo: globalThis.location.origin } : {});
  if (result.error) throw new Error(result.error.message);
}
export async function updatePassword(password: string) {
  const result = await assertDb().auth.updateUser({ password });
  if (result.error) throw new Error(result.error.message);
}
export async function signOut() { unwrap(await assertDb().auth.signOut()); }
export async function saveFinder(userId: string, name: string, taluka: Taluka) {
  unwrap(await assertDb().from('finder_profiles').upsert({ user_id: userId, display_name: name, taluka }));
}
export async function getFinder(userId: string) {
  const result = await assertDb().from('finder_profiles').select('display_name,taluka').eq('user_id', userId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function getFreelancers(): Promise<Freelancer[]> {
  const client = assertDb();
  const [profileResult, sampleResult, premiumResult] = await Promise.all([
    client.from('freelancer_profiles').select('*').order('created_at', { ascending: false }),
    client.from('sample_freelancers').select('*').order('sort_order', { ascending: true }),
    client.from('user_entitlements').select('user_id').eq('premium', true),
  ]);
  const rows = unwrap(profileResult), samples = unwrap(sampleResult);
  const premiumUsers = new Set((unwrap(premiumResult) || []).map((row: any) => row.user_id));
  const realPeople = (rows || []).map((row: any) => ({ id: row.user_id, name: row.display_name, role: row.role_title,
    category: row.category_slug, tags: row.tags || [], taluka: row.taluka as Taluka, place: row.locality || row.taluka,
    lat: row.latitude, lon: row.longitude, rating: 0, reviews: 0, distance: 'Nearby',
    line: row.why_me?.slice(0, 85) || '', why: row.why_me || '', work: row.portfolio || [], image: -1, imageUrl: row.image_url || undefined, premium: premiumUsers.has(row.user_id) }));
  const samplePeople = (samples || []).map((row: any) => ({ id: row.id, name: row.display_name, role: row.role_title,
    category: row.category_slug, tags: row.tags || [], taluka: row.taluka as Taluka, place: row.locality,
    lat: row.latitude, lon: row.longitude, rating: Number(row.rating), reviews: row.review_count, distance: row.taluka,
    line: row.card_line, why: row.why_me, work: row.portfolio || [], image: row.image_index, demo: true }));
  return [...realPeople, ...samplePeople];
}
export async function getCategories(): Promise<Category[]> {
  const rows = unwrap(await assertDb().from('categories').select('slug,label,icon').eq('active', true).order('label')) || [];
  return [{ id: 'all', label: 'All', icon: '▦' }, ...rows.map((row: any) => ({ id: row.slug, label: row.label, icon: row.icon })), { id: 'other', label: 'Other', icon: '✨' }];
}
export async function saveFreelancer(userId: string, person: Freelancer) {
  unwrap(await assertDb().from('freelancer_profiles').upsert({ user_id: userId, display_name: person.name,
    role_title: person.role, category_slug: person.category, tags: person.tags, taluka: person.taluka,
    locality: person.place, latitude: person.lat, longitude: person.lon, why_me: person.why, portfolio: person.work, image_url: person.imageUrl || null }));
}
export async function saveContact(userId: string, phone: string, whatsapp: string) {
  const auth = await account();
  unwrap(await assertDb().from('freelancer_contacts').upsert({ freelancer_id: userId, email: auth.user?.email || null,
    phone: phone || null, whatsapp: whatsapp || null }));
}
export async function getContact(userId: string) {
  const result = await assertDb().from('freelancer_contacts').select('email,phone,whatsapp').eq('freelancer_id', userId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function suggestCategory(userId: string, name: string) {
  unwrap(await assertDb().from('category_suggestions').insert({ freelancer_id: userId, proposed_name: name }));
}
export async function getRequests(userId: string): Promise<RequestPost[]> {
  const rows = unwrap(await assertDb().from('requests').select('id,title,category_slug,details,taluka,created_at,finder_id').order('created_at', { ascending: false }));
  const real = (rows || []).map((row: any) => ({ id: row.id, title: row.title, category: row.category_slug,
    details: row.details, taluka: row.taluka as Taluka, createdAt: new Date(row.created_at).getTime(),
    finder: row.finder_id === userId ? 'You' : 'Local Finder', finderId: row.finder_id }));
  return real;
}
export async function createRequest(userId: string, title: string, details: string, category: string, taluka: Taluka) {
  const center = talukaCenters[taluka];
  unwrap(await assertDb().from('requests').insert({ finder_id: userId, title, details, category_slug: category,
    taluka, latitude: center.lat, longitude: center.lon }));
}
export async function applyToRequest(requestId: string, freelancerId: string, note: string) {
  unwrap(await assertDb().from('applications').insert({ request_id: requestId, freelancer_id: freelancerId, note }));
}
export async function getApplications(requestId: string) {
  return unwrap(await assertDb().from('applications').select('id,freelancer_id,note,status,created_at').eq('request_id', requestId)) || [];
}
export async function setApplicationStatus(id: string, status: 'shortlisted' | 'declined') {
  unwrap(await assertDb().from('applications').update({ status }).eq('id', id));
}
export async function getMessages(finderId: string, freelancerId: string) {
  const client = assertDb();
  return unwrap(await client.from('chat_messages').select('id,body,sender_id,created_at,finder_id,freelancer_id')
    .eq('finder_id', finderId).eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: true })) || [];
}
export async function getChatPartners(userId: string): Promise<{ id: string; finderId: string; freelancerId: string }[]> {
  const rows = unwrap(await assertDb().from('chat_messages').select('finder_id,freelancer_id')
    .or(`finder_id.eq.${userId},freelancer_id.eq.${userId}`).order('created_at', { ascending: false })) || [];
  return [...new Map(rows.map((row: any) => [row.finder_id + ':' + row.freelancer_id,
    { id: row.finder_id === userId ? row.freelancer_id : row.finder_id, finderId: row.finder_id, freelancerId: row.freelancer_id }])).values()];
}
export async function createMessage(finderId: string, freelancerId: string, senderId: string, body: string) {
  unwrap(await assertDb().from('chat_messages').insert({ finder_id: finderId, freelancer_id: freelancerId, sender_id: senderId, body }));
}
export async function getNotifications() {
  return unwrap(await assertDb().from('notifications').select('id,kind,title,created_at,seen_at,related_id').order('created_at', { ascending: false }).limit(30)) || [];
}
export async function isAdmin(userId: string) {
  const result = await assertDb().from('admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return !!result.data;
}
export async function getCategorySuggestions() {
  return unwrap(await assertDb().from('category_suggestions').select('id,proposed_name,status,created_at').eq('status', 'pending').order('created_at', { ascending: true })) || [];
}
export async function reviewCategory(id: string, name: string, approve: boolean) {
  const client = assertDb();
  if (approve) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    if (slug.length < 2) throw new Error('Category name needs at least two Latin letters or digits.');
    unwrap(await client.from('categories').upsert({ slug, label: name.trim(), icon: '✨', active: true }));
  }
  unwrap(await client.from('category_suggestions').update({ status: approve ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id));
}
