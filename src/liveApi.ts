import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Category, Freelancer, RequestPost, talukaCenters, Taluka } from './data';
import { liveEnabled, supabasePublishableKey, supabaseUrl } from './supabaseConfig';
import { normalizeLinks, normalizeSoftware, PortfolioLink, SoftwareSkill } from './software';
import { DESCRIPTION_LIMIT } from './descriptionFormatting';
import { confirmEmailOtp, requestEmailOtp } from './emailOtp';

export const db: SupabaseClient | null = liveEnabled ? createClient(supabaseUrl, supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web', ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }) },
}) : null;

function assertDb() { if (!db) throw new Error('Supabase project settings are missing.'); return db; }
function unwrap<T>(result: { data?: T; error: { message: string } | null }): T { if (result.error) throw new Error(result.error.message); return result.data as T; }

export async function account() { const result = await assertDb().auth.getUser(); if (result.error?.name === 'AuthSessionMissingError') return { user: null }; if (result.error) throw new Error(result.error.message); return result.data; }
export type AccountKind = 'finder' | 'freelancer';

export async function sendEmailCode(email: string, signup?: { name: string; taluka: Taluka; accountKind: AccountKind }) {
  await requestEmailOtp(assertDb().auth, email, signup);
}
export async function verifyEmailCode(email: string, token: string) {
  return confirmEmailOtp(assertDb().auth, email, token);
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
  const [profileResult, sampleResult, premiumResult, presenceResult, responseResult, reviewResult] = await Promise.all([
    client.from('freelancer_profiles').select('user_id,display_name,role_title,category_slug,tags,taluka,locality,latitude,longitude,why_me,description,software_skills,portfolio_links,portfolio,image_url,created_at').order('created_at', { ascending: false }),
    client.from('sample_freelancers').select('id,display_name,role_title,category_slug,tags,taluka,locality,latitude,longitude,why_me,portfolio,card_line,image_index,rating,review_count,sort_order').order('sort_order', { ascending: true }),
    client.from('user_entitlements').select('user_id').eq('premium', true),
    client.from('freelancer_presence').select('freelancer_id,last_active_at'),
    client.rpc('freelancer_response_stats'),
    client.rpc('freelancer_review_summary'),
  ]);
  const rows = unwrap(profileResult), samples = unwrap(sampleResult);
  const premiumUsers = new Set((unwrap(premiumResult) || []).map((row: any) => row.user_id));
  // The directory remains usable while the presence migration is being applied.
  const activity = new Map((presenceResult.data || []).map((row: any) => [row.freelancer_id, row.last_active_at]));
  const responses = new Map<string, { median_response_minutes: number; response_count: number }>((responseResult.data || []).map((row: any) => [row.freelancer_id, row]));
  const reviews = new Map<string, { review_count: number; average_rating: number }>((reviewResult.data || []).map((row: any) => [row.freelancer_id, row]));
  // Sample-only states disappear with the sample rows; real accounts always use tracked activity.
  const sampleActivityMinutes = [0, 18, 145, 46, 0, 1440, 35, 8];
  const sampleResponseMinutes = [6, 28, 12, 52, 9, 120, 14, 38];
  const sampleSoftware: Record<string, SoftwareSkill[]> = {
    photography: [{ name: 'Adobe Lightroom', website: 'https://www.adobe.com' }, { name: 'Adobe Photoshop', website: 'https://www.adobe.com' }],
    video: [{ name: 'DaVinci Resolve', slug: 'davinciresolve' }, { name: 'Adobe Premiere Pro', website: 'https://www.adobe.com' }],
    design: [{ name: 'Figma', slug: 'figma' }, { name: 'Canva', website: 'https://www.canva.com' }],
    events: [{ name: 'Notion', slug: 'notion' }, { name: 'Canva', website: 'https://www.canva.com' }],
    music: [{ name: 'Pro Tools', slug: 'protools' }, { name: 'Ableton Live', website: 'https://www.ableton.com' }],
    tutoring: [{ name: 'Google Docs', website: 'https://docs.google.com' }, { name: 'Zoom', slug: 'zoom' }],
  };
  const sampledAt = Date.now();
  const realPeople = (rows || []).map((row: any) => ({ id: row.user_id, name: row.display_name, role: row.role_title,
    category: row.category_slug, tags: row.tags || [], taluka: row.taluka as Taluka, place: row.locality || row.taluka,
    lat: row.latitude, lon: row.longitude, rating: Number(reviews.get(row.user_id)?.average_rating || 0), reviews: reviews.get(row.user_id)?.review_count || 0, distance: 'Nearby',
    line: row.why_me?.slice(0, 85) || '', why: row.why_me || '', description: row.description || '', software: normalizeSoftware(row.software_skills), links: normalizeLinks(row.portfolio_links), work: row.portfolio || [], image: -1, imageUrl: row.image_url || undefined, premium: premiumUsers.has(row.user_id), lastActiveAt: activity.get(row.user_id),
    responseMinutes: responses.get(row.user_id)?.median_response_minutes, responseSamples: responses.get(row.user_id)?.response_count }));
  const samplePeople = (samples || []).map((row: any) => ({ id: row.id, name: row.display_name, role: row.role_title,
    category: row.category_slug, tags: row.tags || [], taluka: row.taluka as Taluka, place: row.locality,
    lat: row.latitude, lon: row.longitude, rating: Number(row.rating), reviews: row.review_count, distance: row.taluka,
    line: row.card_line, why: row.why_me, software: sampleSoftware[row.category_slug] || [], work: row.portfolio || [], image: row.image_index, demo: true,
    lastActiveAt: new Date(sampledAt - sampleActivityMinutes[(Math.max(1, Number(row.sort_order) || 1) - 1) % sampleActivityMinutes.length] * 60_000).toISOString(),
    responseMinutes: sampleResponseMinutes[(Math.max(1, Number(row.sort_order) || 1) - 1) % sampleResponseMinutes.length] }));
  return [...realPeople, ...samplePeople];
}
export async function markFreelancerActive(userId: string) {
  const result = await assertDb().from('freelancer_presence').upsert({ freelancer_id: userId }, { onConflict: 'freelancer_id' });
  if (result.error) throw new Error(result.error.message);
}
export async function getCategories(): Promise<Category[]> {
  const rows = unwrap(await assertDb().from('categories').select('slug,label,icon').eq('active', true).order('label')) || [];
  return [{ id: 'all', label: 'All', icon: '▦' }, ...rows.map((row: any) => ({ id: row.slug, label: row.label, icon: row.icon })), { id: 'other', label: 'Other', icon: '✨' }];
}
export async function saveFreelancer(userId: string, person: Freelancer) {
  unwrap(await assertDb().from('freelancer_profiles').upsert({ user_id: userId, display_name: person.name,
    role_title: person.role, category_slug: person.category, tags: person.tags, taluka: person.taluka,
    locality: person.place, latitude: person.lat, longitude: person.lon, why_me: person.why, description: (person.description || '').slice(0, DESCRIPTION_LIMIT), software_skills: normalizeSoftware(person.software), portfolio_links: normalizeLinks(person.links), portfolio: person.work, image_url: person.imageUrl || null }));
}
export async function savePortfolioLinks(userId: string, links: PortfolioLink[]) {
  unwrap(await assertDb().from('freelancer_profiles').update({ portfolio_links: normalizeLinks(links) }).eq('user_id', userId));
}
export async function saveContact(userId: string, phone: string, whatsapp: string, isPublic: boolean) {
  const auth = await account();
  unwrap(await assertDb().from('freelancer_contacts').upsert({ freelancer_id: userId, email: auth.user?.email || null,
    phone: phone || null, whatsapp: whatsapp || null, is_public: isPublic }));
}
export async function getContact(userId: string) {
  const result = await assertDb().from('freelancer_contacts').select('email,phone,whatsapp,is_public').eq('freelancer_id', userId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function getPublicContact(userId: string) {
  const result = await assertDb().from('freelancer_contacts').select('email,phone,whatsapp').eq('freelancer_id', userId).eq('is_public', true).maybeSingle();
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
export async function connectRequestApplication(applicationId: string): Promise<{ finder_id: string; freelancer_id: string }> {
  return unwrap(await assertDb().rpc('connect_request_application', { p_application: applicationId })) as { finder_id: string; freelancer_id: string };
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
export async function getChatPartners(userId: string): Promise<{ id: string; finderId: string; freelancerId: string; finderName: string }[]> {
  const rows = unwrap(await assertDb().rpc('my_chat_partners')) || [];
  return rows.map((row: any) => ({ id: row.finder_id === userId ? row.freelancer_id : row.finder_id,
    finderId: row.finder_id, freelancerId: row.freelancer_id, finderName: row.finder_name }));
}
export async function createMessage(finderId: string, freelancerId: string, senderId: string, body: string) {
  unwrap(await assertDb().from('chat_messages').insert({ finder_id: finderId, freelancer_id: freelancerId, sender_id: senderId, body }));
}
export type FreelancerReview = { finder_id: string; freelancer_id: string; rating: number; body: string; created_at: string };
export async function getFreelancerReviews(freelancerId: string): Promise<FreelancerReview[]> {
  return unwrap(await assertDb().from('freelancer_reviews').select('finder_id,freelancer_id,rating,body,created_at')
    .eq('freelancer_id', freelancerId).order('created_at', { ascending: false }).limit(50)) || [];
}
export async function saveFreelancerReview(finderId: string, freelancerId: string, rating: number, body: string) {
  unwrap(await assertDb().from('freelancer_reviews').upsert({ finder_id: finderId, freelancer_id: freelancerId, rating, body }, { onConflict: 'finder_id,freelancer_id' }));
}
export async function canReviewFreelancer(finderId: string, freelancerId: string) {
  const result = await assertDb().from('chat_messages').select('id').eq('finder_id', finderId)
    .eq('freelancer_id', freelancerId).eq('sender_id', finderId).eq('message_type', 'user').limit(1);
  if (result.error) throw new Error(result.error.message);
  return !!result.data?.length;
}
export async function getNotifications() {
  return unwrap(await assertDb().from('notifications').select('id,kind,title,created_at,seen_at,related_id').order('created_at', { ascending: false }).limit(30)) || [];
}
export async function getUnreadMessageCount(): Promise<number> {
  const { count, error } = await assertDb().from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'message').is('seen_at', null);
  if (error) throw new Error(error.message);
  return count || 0;
}
export async function markConversationRead(messageIds: string[]) {
  if (!messageIds.length) return;
  const { error } = await assertDb().from('notifications').update({ seen_at: new Date().toISOString() }).eq('kind', 'message').is('seen_at', null).in('related_id', messageIds);
  if (error) throw new Error(error.message);
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
