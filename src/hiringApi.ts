import { db } from './liveApi';
import { ProposalTerms } from './hiring';

function client() { if (!db) throw new Error('Open the live app and sign in to use hiring.'); return db; }
function value<T>(result: { data: T; error: { message: string } | null }): T { if (result.error) throw new Error(result.error.message); return result.data; }

export type ServiceRow = { id: string; freelancer_id: string; title: string; description: string; category_slug: string; availability_mode: string; deliverables: string[]; location: string; turnaround_days: number | null; active: boolean };
export type PricingRow = { id: string; service_id: string; model: string; label: string; currency: string; rate_minor: number | null; terms: Record<string, unknown> };
export type HiringRow = { id: string; finder_id: string; freelancer_id: string; service_id: string | null; status: string; accepted_proposal_id: string | null; created_at: string };
export type ProposalRow = { id: string; request_id: string; version: number; sender_id: string; recipient_id: string; terms: ProposalTerms; status: string; created_at: string };
export type AgreementRow = { id: string; request_id: string; proposal_id: string; status: string; compliance_status: string; jurisdiction: string; state_code: string | null };
export type DocumentRow = { id: string; agreement_id: string; version: number; body: string; sha256: string; pdf_path: string | null; terms_snapshot: ProposalTerms };

export async function servicesFor(freelancerId: string) {
  const services = value(await client().from('service_listings').select('*').eq('freelancer_id', freelancerId).order('created_at', { ascending: false })) as ServiceRow[];
  const prices = services.length ? value(await client().from('service_pricing').select('*').in('service_id', services.map(s => s.id))) as PricingRow[] : [];
  return { services, prices };
}
export async function saveService(input: Pick<ServiceRow,'title'|'description'|'category_slug'|'availability_mode'|'deliverables'|'location'> & { freelancer_id: string; id?: string; turnaround_days?: number | null }) {
  const row = value(await client().from('service_listings').upsert(input).select('id').single());
  if (!row) throw new Error('Service was not saved.');
  return row.id as string;
}
export async function savePrice(input: { service_id: string; model: string; label: string; currency: string; rate_minor: number | null; terms?: Record<string, unknown> }) {
  value(await client().from('service_pricing').upsert(input, { onConflict: 'service_id,model,label' }));
}
export async function getPreferences(freelancerId: string) {
  return value(await client().from('work_preferences').select('*').eq('freelancer_id', freelancerId).maybeSingle()) as { weekly_capacity_hours: number; max_concurrent_projects: number; timezone: string } | null;
}
export async function publicAvailability(freelancerId: string) {
  const now = new Date(); now.setDate(now.getDate() - ((now.getDay()+6)%7)); now.setHours(0,0,0,0);
  const week = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const rows = value(await client().rpc('public_availability_summary', { p_freelancer: freelancerId, p_week: week })) as { weekly_capacity_hours: number; allocated_hours: number; remaining_hours: number; active_projects: number; queue_length: number; reserved: { startAt: string; endAt: string; kind: string }[] }[];
  return rows[0] || null;
}
export async function savePreferences(freelancerId: string, weeklyHours: number, maxProjects: number, timezone: string) {
  value(await client().from('work_preferences').upsert({ freelancer_id: freelancerId, weekly_capacity_hours: weeklyHours, max_concurrent_projects: maxProjects, timezone }));
}
export async function listHiring() {
  const requests = value(await client().from('hiring_requests').select('*').order('created_at', { ascending: false })) as HiringRow[];
  const proposals = requests.length ? value(await client().from('proposal_versions').select('*').in('request_id', requests.map(r => r.id)).order('version')) as ProposalRow[] : [];
  const agreements = requests.length ? value(await client().from('agreements').select('*').in('request_id', requests.map(r => r.id))) as AgreementRow[] : [];
  return { requests, proposals, agreements };
}
export async function sendProposal(requestId: string | null, finderId: string, freelancerId: string, serviceId: string | null, terms: ProposalTerms) {
  return value(await client().rpc('send_hiring_proposal', { p_request: requestId, p_finder: finderId, p_freelancer: freelancerId, p_service: serviceId, p_terms: terms })) as string;
}
export async function decideProposal(id: string, decision: 'accepted' | 'rejected') {
  value(await client().rpc('decide_hiring_proposal', { p_proposal: id, p_decision: decision }));
}
export async function createAgreement(requestId: string) {
  return value(await client().rpc('create_hiring_agreement', { p_request: requestId })) as string;
}
export async function agreementDetails(agreementId: string) {
  const documents = value(await client().from('agreement_documents').select('*').eq('agreement_id', agreementId).order('version', { ascending: false })) as DocumentRow[];
  const identities = value(await client().from('agreement_party_identity').select('*').eq('agreement_id', agreementId)) as { user_id: string; legal_name: string; party_type: string }[];
  const approvals = documents[0] ? value(await client().from('agreement_approvals').select('*').eq('document_id', documents[0].id)) as { signer_id: string }[] : [];
  const signatures = documents[0] ? value(await client().from('signing_events').select('*').eq('document_id', documents[0].id)) as { signer_id: string; method: string; status: string }[] : [];
  const disputes = value(await client().from('agreement_disputes').select('*').eq('agreement_id', agreementId).order('created_at', { ascending: false })) as { id: string; category: string; description: string; status: string }[];
  const disputeSubmissions = disputes.length ? value(await client().from('dispute_submissions').select('*').in('dispute_id',disputes.map(d => d.id)).order('created_at')) as { id:string; dispute_id:string; author_id:string; body:string; created_at:string }[] : [];
  const timeEntries = value(await client().from('time_entries').select('*').eq('agreement_id',agreementId).order('starts_at',{ascending:false})) as { id:string; starts_at:string; ends_at:string; description:string; status:string }[];
  const deliverables = value(await client().from('deliverable_submissions').select('*').eq('agreement_id',agreementId).order('submitted_at',{ascending:false})) as { id:string; title:string; external_url:string|null; status:string }[];
  const payments = value(await client().from('payment_obligations').select('*').eq('agreement_id',agreementId)) as { id:string; kind:string; amount_minor:number|null; currency:string; status:string }[];
  return { documents, identities, approvals, signatures, disputes, disputeSubmissions, timeEntries, deliverables, payments };
}
export async function saveLegalIdentity(agreementId: string, userId: string, legalName: string, partyType: 'individual' | 'business') {
  value(await client().from('agreement_party_identity').upsert({ agreement_id: agreementId, user_id: userId, legal_name: legalName, party_type: partyType }));
}
export async function generateAgreement(agreementId: string) {
  const { data, error } = await client().functions.invoke('hiring-documents', { body: { action: 'generate', agreementId } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function exportEvidence(agreementId: string) {
  const { data, error } = await client().functions.invoke('hiring-documents', { body: { action: 'evidence', agreementId } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function getPrivatePdf(path: string) {
  const { data, error } = await client().storage.from('agreement-private').createSignedUrl(path, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
export async function approveDocument(id: string) { value(await client().rpc('approve_agreement_document', { p_document: id })); }
export async function acknowledgeDocument(id: string) { value(await client().rpc('acknowledge_agreement_document', { p_document: id })); }
export async function openDispute(agreementId: string, category: string, description: string, resolution: string) {
  return value(await client().rpc('open_agreement_dispute', { p_agreement: agreementId, p_category: category, p_description: description, p_resolution: resolution })) as string;
}
export async function respondToDispute(disputeId: string, body: string) {
  value(await client().rpc('submit_dispute_response',{p_dispute:disputeId,p_body:body}));
}
export async function submitTime(agreementId: string, start: string, end: string, description: string) {
  value(await client().rpc('submit_hourly_entry',{p_agreement:agreementId,p_start:start,p_end:end,p_description:description}));
}
export async function reviewTime(id: string, status: 'approved'|'disputed'|'rejected') {
  value(await client().rpc('review_hourly_entry',{p_entry:id,p_status:status}));
}
export async function submitDeliverable(agreementId: string, title: string, url: string) {
  value(await client().rpc('submit_deliverable',{p_agreement:agreementId,p_title:title,p_url:url}));
}
export async function reviewDeliverable(id: string, status: 'accepted'|'revision_requested'|'disputed') {
  value(await client().rpc('review_deliverable',{p_submission:id,p_status:status}));
}
export async function profileSignature(userId: string) {
  const row = value(await client().from('signature_assets').select('storage_path,legal_name').eq('user_id',userId).maybeSingle()) as { storage_path: string; legal_name:string } | null;
  if (!row) return null;
  return { path: row.storage_path, legalName:row.legal_name, url: await getPrivatePdf(row.storage_path) };
}
export async function saveProfileSignature(userId: string, legalName: string, bytes: Blob) {
  if (legalName.trim().length<2) throw new Error('Enter your full legal name.');
  const path = `${userId}/signatures/${Date.now()}.png`;
  const { error } = await client().storage.from('agreement-private').upload(path, bytes, { contentType: 'image/png', upsert: false });
  if (error) throw new Error(error.message);
  value(await client().from('signature_assets').upsert({ user_id: userId, storage_path: path, legal_name:legalName.trim() }));
}
export async function removeProfileSignature(userId: string) {
  const current = await profileSignature(userId);
  value(await client().from('signature_assets').delete().eq('user_id',userId));
  if (current) await client().storage.from('agreement-private').remove([current.path]);
}
