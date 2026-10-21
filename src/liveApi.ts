import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Category, Freelancer, RequestPost, talukaCenters, Taluka } from './data';
import { liveEnabled, supabasePublishableKey, supabaseUrl } from './supabaseConfig';
import { normalizeLinks, normalizeSoftware, PortfolioLink, SoftwareSkill } from './software';
import { DESCRIPTION_LIMIT } from './descriptionFormatting';
import { confirmEmailOtp, requestEmailOtp } from './emailOtp';
import { whatsappUrl } from './whatsapp';
import { summarizeChatInbox, type ChatInboxEntry, type InboxMessageRow } from './chatInbox';
import { CHAT_IMAGE_TARGET_BYTES } from './chatImages';
import { FRAME_PRESETS, type FramePreset, type ProfileFrameDesign } from './ProfileFrame';

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
  const [profileResult, sampleResult, premiumResult, presenceResult, responseResult, reviewResult, contactResult, frameResult, frameSelectionResult] = await Promise.all([
    client.from('freelancer_profiles').select('user_id,display_name,role_title,category_slug,tags,taluka,locality,latitude,longitude,why_me,description,software_skills,portfolio_links,portfolio,image_url,created_at').order('created_at', { ascending: false }),
    client.from('sample_freelancers').select('id,display_name,role_title,category_slug,tags,taluka,locality,latitude,longitude,why_me,portfolio,card_line,image_index,rating,review_count,sort_order').order('sort_order', { ascending: true }),
    client.from('user_entitlements').select('user_id').eq('premium', true),
    client.from('freelancer_presence').select('freelancer_id,last_active_at'),
    client.rpc('freelancer_response_stats'),
    client.rpc('freelancer_review_summary'),
    client.from('freelancer_contacts').select('freelancer_id,whatsapp').eq('is_public', true),
    client.from('profile_frames').select('id,name,storage_path').eq('active', true),
    client.from('profile_frame_selections').select('freelancer_id,preset,custom_frame_id'),
  ]);
  const rows = unwrap(profileResult), samples = unwrap(sampleResult);
  const premiumUsers = new Set((unwrap(premiumResult) || []).map((row: any) => row.user_id));
  // The directory remains usable while the presence migration is being applied.
  const activity = new Map((presenceResult.data || []).map((row: any) => [row.freelancer_id, row.last_active_at]));
  const responses = new Map<string, { median_response_minutes: number; response_count: number }>((responseResult.data || []).map((row: any) => [row.freelancer_id, row]));
  const reviews = new Map<string, { review_count: number; average_rating: number }>((reviewResult.data || []).map((row: any) => [row.freelancer_id, row]));
  const publicContacts = new Map<string, string>((contactResult.data || []).map((row: any) => [row.freelancer_id, row.whatsapp]));
  const frameDesigns = new Map<string, string>((frameResult.data || []).map((row: any) => [row.id, client.storage.from('profile-frames').getPublicUrl(row.storage_path).data.publicUrl]));
  const frameSelections = new Map<string, { preset: FramePreset; custom_frame_id: string | null }>((frameSelectionResult.data || []).map((row: any) => [row.freelancer_id, row]));
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
    line: row.why_me?.slice(0, 85) || '', why: row.why_me || '', description: row.description || '', software: normalizeSoftware(row.software_skills), links: normalizeLinks(row.portfolio_links), publicWhatsappUrl: whatsappUrl(publicContacts.get(row.user_id) || '') || undefined, work: row.portfolio || [], image: -1, imageUrl: row.image_url || undefined, framePreset: frameSelections.get(row.user_id)?.preset || 'classic', frameCustomId: frameSelections.get(row.user_id)?.custom_frame_id || undefined, frameOverlayUrl: frameDesigns.get(frameSelections.get(row.user_id)?.custom_frame_id || '') || undefined, premium: premiumUsers.has(row.user_id), lastActiveAt: activity.get(row.user_id),
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
export async function getProfileFrames(): Promise<ProfileFrameDesign[]> {
  const client = assertDb();
  const result = await client.from('profile_frames').select('id,name,storage_path').eq('active', true).order('created_at', { ascending: false });
  if (result.error) return [];
  return (result.data || []).map(row => ({ id: row.id, name: row.name, url: client.storage.from('profile-frames').getPublicUrl(row.storage_path).data.publicUrl }));
}
export async function saveProfileFrame(userId: string, preset: string, customFrameId: string | null): Promise<void> {
  if (!FRAME_PRESETS.some(frame => frame.key === preset)) throw new Error('Choose a valid frame style.');
  unwrap(await assertDb().from('profile_frame_selections').upsert({ freelancer_id: userId, preset, custom_frame_id: customFrameId, updated_at: new Date().toISOString() }));
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
  const rows = unwrap(await assertDb().from('requests').select('id,title,category_slug,details,taluka,created_at,finder_id,moderation_status').order('created_at', { ascending: false }));
  const real = (rows || []).map((row: any) => ({ id: row.id, title: row.title, category: row.category_slug,
    details: row.details, taluka: row.taluka as Taluka, createdAt: new Date(row.created_at).getTime(),
    finder: row.finder_id === userId ? 'You' : 'Local Finder', finderId: row.finder_id, moderationStatus: row.moderation_status }));
  return real;
}
export async function createRequest(userId: string, title: string, details: string, category: string, taluka: Taluka) {
  const center = talukaCenters[taluka];
  unwrap(await assertDb().from('requests').insert({ finder_id: userId, title, details, category_slug: category,
    taluka, latitude: center.lat, longitude: center.lon }));
}
export type ContentModerationFlag = { id: string; target_kind: 'account' | 'service' | 'media' | 'request'; target_id: string | null; target_title: string | null; reason: string; created_at: string; status: string };
export async function getMyContentFlags(userId: string): Promise<ContentModerationFlag[]> {
  const rows = unwrap(await assertDb().from('admin_flags')
    .select('id,target_kind,target_id,target_title,reason,created_at,status')
    .eq('user_id', userId).eq('status', 'under_review')
    .order('created_at', { ascending: false }));
  return rows || [];
}
export async function getInquiryParticipants(inquiryId: string): Promise<{ finder_id: string; freelancer_id: string } | null> {
  const result = await assertDb().from('freelancer_inquiries').select('finder_id,freelancer_id').eq('id', inquiryId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function getBlockedFreelancers(): Promise<string[]> {
  const rows = unwrap(await assertDb().from('freelancer_blocks').select('freelancer_id')) || [];
  return rows.map((row: { freelancer_id: string }) => row.freelancer_id);
}
export async function setFreelancerBlocked(finderId: string, freelancerId: string, blocked: boolean): Promise<void> {
  const client = assertDb();
  if (blocked) unwrap(await client.from('freelancer_blocks').insert({ finder_id: finderId, freelancer_id: freelancerId }));
  else unwrap(await client.from('freelancer_blocks').delete().eq('finder_id', finderId).eq('freelancer_id', freelancerId));
}
export async function reportFreelancer(finderId: string, freelancerId: string, reason: string): Promise<void> {
  unwrap(await assertDb().from('freelancer_reports').insert({ finder_id: finderId, freelancer_id: freelancerId, reason: reason.trim() }));
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
export async function getChatInbox(userId: string): Promise<Record<string, ChatInboxEntry>> {
  const client = assertDb();
  const recentResult = await client.from('chat_messages')
    .select('id,finder_id,freelancer_id,sender_id,body,created_at')
    .or(`finder_id.eq.${userId},freelancer_id.eq.${userId}`)
    .order('created_at', { ascending: false }).limit(300);
  const recent = unwrap(recentResult) as InboxMessageRow[];
  const unreadIds: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const batch = unwrap(await client.from('notifications').select('related_id')
      .eq('user_id', userId).eq('kind', 'message').is('seen_at', null)
      .order('created_at', { ascending: true }).range(offset, offset + 999)) as { related_id: string | null }[];
    unreadIds.push(...batch.map(row => row.related_id).filter((id): id is string => !!id));
    if (batch.length < 1000) break;
  }
  const messages = new Map(recent.map(row => [row.id, row]));
  for (let offset = 0; offset < unreadIds.length; offset += 100) {
    const batch = unwrap(await client.from('chat_messages')
      .select('id,finder_id,freelancer_id,sender_id,body,created_at')
      .in('id', unreadIds.slice(offset, offset + 100))) as InboxMessageRow[];
    batch.forEach(row => messages.set(row.id, row));
  }
  return summarizeChatInbox(userId, [...messages.values()], new Set(unreadIds));
}
export async function createMessage(finderId: string, freelancerId: string, senderId: string, body: string) {
  unwrap(await assertDb().from('chat_messages').insert({ finder_id: finderId, freelancer_id: freelancerId, sender_id: senderId, body }));
}
export type ChatAttachment = { fileName: string; mimeType: string; sizeBytes: number; url: string };
export async function getChatAttachments(messageIds: string[]): Promise<Record<string, ChatAttachment>> {
  if (!messageIds.length) return {};
  const client = assertDb();
  const rows: { message_id: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number }[] = [];
  for (let offset = 0; offset < messageIds.length; offset += 100) {
    const ids = messageIds.slice(offset, offset + 100);
    const rpc = await client.rpc('list_my_chat_attachments', { p_message_ids: ids });
    if (!rpc.error) rows.push(...(rpc.data || []));
    else rows.push(...(unwrap(await client.from('chat_attachments')
      .select('message_id,storage_path,file_name,mime_type,size_bytes')
      .in('message_id', ids)) || []));
  }
  const entries = await Promise.all(rows.map(async row => {
    const result = await client.storage.from('chat-private').createSignedUrl(row.storage_path, 3600);
    return [row.message_id, { fileName: row.file_name, mimeType: row.mime_type, sizeBytes: row.size_bytes, url: result.data?.signedUrl || '' }] as const;
  }));
  return Object.fromEntries(entries);
}
export const chatFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export function chatFileError(file: { type: string; size: number; name: string }): string | null {
  if (!chatFileTypes.includes(file.type)) return 'Attach a PDF, JPEG, PNG or WebP file.';
  if (!file.size) return 'Choose a non-empty file.';
  if (file.type.startsWith('image/') && file.size > CHAT_IMAGE_TARGET_BYTES) return 'Could not resize this image below 300 KB.';
  if (file.type === 'application/pdf' && file.size > 10 * 1024 * 1024) return 'Keep PDF files under 10 MB.';
  if (!file.name.trim()) return 'Choose a named file.';
  return null;
}
export async function sendChatAttachment(finderId: string, freelancerId: string, senderId: string, file: File): Promise<void> {
  const problem = chatFileError(file);
  if (problem) throw new Error(problem);
  const client = assertDb();
  const path = `${senderId}/${crypto.randomUUID()}`;
  const uploaded = await client.storage.from('chat-private').upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new Error(uploaded.error.message);
  try {
    unwrap(await client.rpc('send_chat_attachment', {
      p_finder: finderId, p_freelancer: freelancerId, p_path: path,
      p_file_name: file.name.slice(0, 180), p_mime: file.type, p_size: file.size,
    }));
  } catch (error) {
    await client.storage.from('chat-private').remove([path]);
    throw error;
  }
}
export async function getSavedProfiles(): Promise<string[]> {
  return (unwrap(await assertDb().from('profile_saves').select('freelancer_id')) || []).map((row: any) => row.freelancer_id);
}
export async function setProfileSaved(finderId: string, freelancerId: string, saved: boolean): Promise<void> {
  const client = assertDb();
  if (saved) unwrap(await client.from('profile_saves').insert({ freelancer_id: freelancerId, finder_id: finderId }));
  else unwrap(await client.from('profile_saves').delete().eq('finder_id', finderId).eq('freelancer_id', freelancerId));
}
export async function recordProfileView(freelancerId: string): Promise<void> {
  unwrap(await assertDb().rpc('record_profile_view', { p_freelancer: freelancerId }));
}
export async function getMyProfileStats(): Promise<{ profileViews: number; saves: number }> {
  const rows = unwrap(await assertDb().rpc('my_profile_stats')) || [];
  return { profileViews: Number(rows[0]?.profile_views || 0), saves: Number(rows[0]?.saves || 0) };
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
  return unwrap(await assertDb().from('notifications').select('id,kind,title,created_at,seen_at,related_id').neq('kind', 'message').order('created_at', { ascending: false }).limit(50)) || [];
}
export async function getUnreadNotificationCount(): Promise<number> {
  const result = await assertDb().from('notifications').select('id', { count: 'exact', head: true }).neq('kind', 'message').is('seen_at', null);
  if (result.error) throw new Error(result.error.message);
  return result.count || 0;
}
export async function markNotificationsRead(): Promise<void> {
  unwrap(await assertDb().from('notifications').update({ seen_at: new Date().toISOString() }).neq('kind', 'message').is('seen_at', null));
}
export async function markNotificationRead(notificationId: string): Promise<void> {
  unwrap(await assertDb().from('notifications').update({ seen_at: new Date().toISOString() }).eq('id', notificationId).is('seen_at', null));
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
export async function markChatRead(finderId: string, freelancerId: string, incomingMessageIds: string[]): Promise<void> {
  const result = await assertDb().rpc('mark_chat_read', { p_finder: finderId, p_freelancer: freelancerId });
  if (result.error?.code === 'PGRST202') return markConversationRead(incomingMessageIds);
  if (result.error) throw new Error(result.error.message);
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
