import { db } from './liveApi';
import { inquiryValidationError } from './inquiryValidation';

export type Inquiry = {
  id: string; finder_id: string; freelancer_id: string; title: string; requirements: string;
  work_mode: 'remote' | 'in_person' | 'either'; preferred_start: string | null;
  preferred_end: string | null; budget_note: string | null;
  status: 'pending' | 'approved' | 'declined'; response_note: string | null;
  created_at: string; responded_at: string | null; finder_name: string;
  freelancer_name: string; finder_taluka: string;
  reference_names?: string[];
};
export type InquiryAttachment = { id: string; inquiry_id: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number };
export type InquiryInput = Pick<Inquiry, 'title' | 'requirements' | 'work_mode'> & {
  preferred_start?: string; preferred_end?: string; budget_note?: string;
};
const client = () => { if (!db) throw new Error('Supabase is not configured.'); return db; };
const check = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export async function listInquiries(): Promise<Inquiry[]> {
  const { data, error } = await client().rpc('my_freelancer_inquiries');
  check(error);
  return (data || []) as Inquiry[];
}

export async function submitInquiry(finderId: string, freelancerId: string, input: InquiryInput, files: File[]): Promise<{ id: string; failed: string[] }> {
  const validation = inquiryValidationError(input, files);
  if (validation) throw new Error(validation);
  const { data, error } = await client().from('freelancer_inquiries').insert({
    finder_id: finderId, freelancer_id: freelancerId, title: input.title.trim(), requirements: input.requirements.trim(),
    work_mode: input.work_mode, preferred_start: input.preferred_start || null, preferred_end: input.preferred_end || null,
    budget_note: input.budget_note?.trim() || null,
  }).select('id').single();
  check(error);
  const id = data!.id as string;
  const failures: string[] = [];
  for (const file of files) {
    const path = `${finderId}/${id}/${crypto.randomUUID()}`;
    const uploaded = await client().storage.from('inquiry-private').upload(path, file, { contentType: file.type });
    if (uploaded.error) { failures.push(file.name); continue; }
    const saved = await client().from('inquiry_attachments').insert({ inquiry_id: id, uploaded_by: finderId, storage_path: path, file_name: file.name.slice(0, 180), mime_type: file.type, size_bytes: file.size });
    if (saved.error) { await client().storage.from('inquiry-private').remove([path]); failures.push(file.name); }
  }
  return { id, failed: failures };
}

export async function listAttachments(inquiryId: string): Promise<InquiryAttachment[]> {
  const { data, error } = await client().from('inquiry_attachments').select('id,inquiry_id,storage_path,file_name,mime_type,size_bytes').eq('inquiry_id', inquiryId);
  check(error);
  return (data || []) as InquiryAttachment[];
}

export async function referenceUrl(path: string): Promise<string> {
  const { data, error } = await client().storage.from('inquiry-private').createSignedUrl(path, 60);
  check(error);
  return data!.signedUrl;
}

export async function decideInquiry(id: string, decision: 'approved' | 'declined', response: string) {
  const { error } = await client().rpc('decide_freelancer_inquiry', { p_inquiry: id, p_decision: decision, p_response: response.trim() || null });
  check(error);
}
