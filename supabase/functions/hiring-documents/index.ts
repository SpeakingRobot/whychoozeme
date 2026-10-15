// Supabase Edge Function. Deploy with: supabase functions deploy hiring-documents
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { ProviderNotConfigured, signingProvider } from './signingProvider.ts';
import { brandLogoBase64 } from './brandLogo.ts';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type' } });
const error = (message: string, status = 400) => json({ error: message }, status);
const sha256 = async (data: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(b => b.toString(16).padStart(2, '0')).join('');
const get = (result: { data: any; error: { message: string } | null }): any => { if (result.error) throw new Error(result.error.message); return result.data; };

async function pdfFor(body: string, signatures: { finder: Uint8Array; freelancer: Uint8Array; finderName: string; freelancerName: string }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(Uint8Array.from(atob(brandLogoBase64), character => character.charCodeAt(0)));
  const finderImage = await pdf.embedPng(signatures.finder);
  const freelancerImage = await pdf.embedPng(signatures.freelancer);
  const margin = 51, width = 595, height = 842;
  let page = pdf.addPage([width, height]), y = height - 173;
  const header = (first = false) => {
    page.drawRectangle({x:0,y:height-8,width,height:8,color:rgb(.45,.22,.96)});
    page.drawImage(logo, { x: (width-203)/2, y: height-76, width:203, height:41 });
    if (first) {
      const title = 'AGREEMENT DRAFT';
      page.drawText(title, {x:(width-bold.widthOfTextAtSize(title,19))/2,y:height-112,size:19,font:bold,color:rgb(.10,.09,.28)});
      page.drawText('Freelance services  |  for review by both parties', {x:165,y:height-132,size:9,font,color:rgb(.42,.39,.52)});
    }
    page.drawLine({start:{x:margin,y:height-(first?148:93)},end:{x:width-margin,y:height-(first?148:93)},thickness:1,color:rgb(.87,.84,.94)});
  };
  header(true);
  const nextPage = () => { page = pdf.addPage([width,height]); y = height-117; header(); };
  const ensure = (needed: number) => { if (y - needed < 75) nextPage(); };
  const line = (value: string, size = 10, strong = false) => {
    ensure(size+12);
    page.drawText(value, { x: margin, y, size, font: strong ? bold : font, color: strong ? rgb(.25,.13,.57) : rgb(.14,.15,.27) }); y -= size + 7;
  };
  for (const paragraph of body.split('\n')) {
    if (!paragraph.trim()) { y -= 7; continue; }
    if (/^5\. Execution/.test(paragraph) && y < 300) nextPage();
    const strong = /^\d+\.|^AGREEMENT|^HIRER|^FREELANCER|^DOCUMENT/.test(paragraph);
    if (/^\d+\./.test(paragraph)) {
      ensure(48); y -= 7;
      page.drawRectangle({x:margin-9,y:y-8,width:4,height:23,color:rgb(1,.32,.43)});
    }
    const words = paragraph.replace(/[^\x20-\x7e]/g, '-').split(/\s+/);
    const measureFont = strong ? bold : font;
    let current = '';
    for (let word of words) {
      while (measureFont.widthOfTextAtSize(word, strong ? 11 : 10) > width-2*margin) {
        if (current) { line(current,strong ? 11 : 10,strong); current=''; }
        let cut=1;
        while (cut<word.length && measureFont.widthOfTextAtSize(`${word.slice(0,cut+1)}-`,strong ? 11 : 10)<width-2*margin) cut++;
        line(`${word.slice(0,cut)}-`,strong ? 11 : 10,strong);
        word=word.slice(cut);
      }
      const candidate = current ? `${current} ${word}` : word;
      if (measureFont.widthOfTextAtSize(candidate, strong ? 11 : 10) > width - 2*margin && current) { line(current, strong ? 11 : 10, strong); current = word; }
      else current = candidate;
    }
    if (current) line(current, strong ? 11 : 10, strong);
  }
  ensure(148); y -= 13;
  line('VISUAL SIGNATURE IMAGES', 11, true);
  line('Uploaded by each account holder. These images do not verify identity or complete eSign.', 8);
  y -= 5; ensure(98);
  const signatureBox = (x: number, image: typeof finderImage, name: string, role: string) => {
    page.drawRectangle({x,y:y-90,width:233,height:91,borderColor:rgb(.87,.83,.94),borderWidth:1,color:rgb(.99,.98,1)});
    const dimensions = image.scaleToFit(190,55);
    page.drawImage(image,{x:x+(233-dimensions.width)/2,y:y-61+(55-dimensions.height)/2,width:dimensions.width,height:dimensions.height});
    page.drawText(role,{x:x+11,y:y-75,size:8,font:bold,color:rgb(.39,.27,.67)});
    page.drawText(name.replace(/[^\x20-\x7e]/g,'-').slice(0,36),{x:x+11,y:y-86,size:8,font,color:rgb(.12,.11,.23)});
  };
  signatureBox(margin,finderImage,signatures.finderName,'FINDER / HIRER');
  signatureBox(width-margin-233,freelancerImage,signatures.freelancerName,'FREELANCER');
  y -= 110;
  pdf.getPages().forEach((p,index) => {
    p.drawLine({start:{x:margin,y:50},end:{x:width-margin,y:50},thickness:.7,color:rgb(.88,.85,.92)});
    p.drawText('Private draft - not fully signed', {x:margin,y:34,size:8,font,color:rgb(.44,.43,.52)});
    p.drawText(`Page ${index+1} of ${pdf.getPageCount()}`, {x:width-margin-63,y:34,size:8,font,color:rgb(.44,.43,.52)});
  });
  return new Uint8Array(await pdf.save());
}

function bodyFrom(agreement: any, proposal: any, finder: any, freelancer: any) {
  const t = proposal.terms;
  const str = (value: unknown) => value === null || value === undefined || value === '' ? 'Not agreed' : String(value);
  const money = (minor: unknown) => minor === null || minor === undefined ? 'Not agreed' : `${t.currency} ${(Number(minor)/100).toFixed(2)}`;
  return [
    `AGREEMENT REFERENCE: ${agreement.id}`,
    `DOCUMENT VERSION: 1 | Accepted proposal: ${proposal.id} (version ${proposal.version})`,
    `Created: ${new Date().toISOString()} | Jurisdiction: ${agreement.jurisdiction}${agreement.state_code ? `/${agreement.state_code}` : ''}`,
    '',
    `HIRER: ${finder.legal_name}${finder.party_type === 'business' ? `, representing ${str(finder.business_name)}` : ''}`,
    `FREELANCER: ${freelancer.legal_name}${freelancer.party_type === 'business' ? `, representing ${str(freelancer.business_name)}` : ''}`,
    '',
    '1. Services and scope',
    `${t.title}. ${t.scope}`,
    `Deliverables: ${Array.isArray(t.deliverables) && t.deliverables.length ? t.deliverables.join('; ') : 'Not separately specified'}.`,
    `Work model: ${t.model}; location: ${str(t.location)}; timezone: ${str(t.timezone)}.`,
    `Start: ${str(t.startAt)}; end or deadline: ${str(t.endAt)}.`,
    '',
    '2. Price and authorization',
    `Rate or fixed fee: ${money(t.rateMinor)}. Quantity: ${str(t.quantity)}.`,
    `Weekly hourly cap: ${str(t.weeklyHourCap)}. Overall spending cap: ${money(t.totalCapMinor)}.`,
    `Conditional calculation: ${str(t.conditionalBasis)}. Payment schedule: ${str(t.paymentSchedule)}.`,
    'Only the accepted offer version controls the stated financial limits. Extra work or spending requires a mutually approved amendment.',
    '',
    '3. Delivery and review',
    `Revisions included: ${str(t.revisions)}. Special conditions: ${str(t.specialConditions)}.`,
    `Milestones: ${Array.isArray(t.milestones) && t.milestones.length ? t.milestones.map((m: any) => `${m.title} (${money(m.amountMinor)}; due ${str(m.dueAt)}; acceptance: ${m.acceptanceCriteria})`).join('; ') : 'Not separately agreed'}.`,
    'Submitted work and hourly entries are subject to the review and dispute process recorded by the platform. A weekly cap limits potential exposure; it does not promise payment for unworked hours.',
    '',
    '4. Changes, cancellation and disputes',
    'Material changes to scope, price, deadlines or caps require a new agreed and, where required, signed amendment. Cancellation, refund, intellectual property, confidentiality, liability and governing-law details require legal review if not expressly included in the accepted offer.',
    '',
    '5. Execution',
    'This draft is a record of agreed commercial terms for review. It is not marked fully signed or active. Both parties must approve this exact document. Provider verified signing and any required stamping, identity checks, registration or witnessing must be completed separately.',
    '',
    `Document status: ${agreement.status}. Legal compliance: ${agreement.compliance_status}.`,
    'Both parties uploaded visual signature images for this review copy. Provider-verified signing remains pending.',
  ].join('\n');
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type' } });
  if (request.method !== 'POST') return error('POST required', 405);
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return error('Authentication required', 401);
    const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return error('Authentication required', 401);
    if (auth.user.banned_until && Date.parse(auth.user.banned_until) > Date.now()) return error('Account suspended', 403);
    const server = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { action, agreementId } = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(String(agreementId))) return error('Invalid agreement ID');
    const agreement = get(await server.from('agreements').select('*').eq('id', agreementId).single());
    const hiring = get(await server.from('hiring_requests').select('*').eq('id', agreement.request_id).single());
    if (auth.user.id !== hiring.finder_id && auth.user.id !== hiring.freelancer_id) return error('Not a party', 403);
    const proposal = get(await server.from('proposal_versions').select('*').eq('id', agreement.proposal_id).single());
    if (proposal.status !== 'accepted' || hiring.accepted_proposal_id !== proposal.id) return error('Accepted version mismatch', 409);

    if (action === 'readiness') {
      const [identities,assets] = await Promise.all([
        server.from('agreement_party_identity').select('user_id').eq('agreement_id',agreementId),
        server.from('signature_assets').select('user_id').in('user_id',[hiring.finder_id,hiring.freelancer_id]),
      ]);
      const names = get(identities) as {user_id:string}[], images = get(assets) as {user_id:string}[];
      return json({finderName: names.some(row=>row.user_id===hiring.finder_id),freelancerName:names.some(row=>row.user_id===hiring.freelancer_id),finderImage:images.some(row=>row.user_id===hiring.finder_id),freelancerImage:images.some(row=>row.user_id===hiring.freelancer_id)});
    }

    if (action === 'generate') {
      const existing = get(await server.from('agreement_documents').select('*').eq('agreement_id',agreementId).order('version',{ascending:false}).limit(1));
      if (existing.length) return json({ documentId: existing[0].id, status: 'already_generated' });
      if (agreement.status !== 'draft') return error('Agreement is already under review', 409);
      const identities = get(await server.from('agreement_party_identity').select('*').eq('agreement_id',agreementId));
      const finder = identities.find((p: any) => p.user_id === hiring.finder_id);
      const freelancer = identities.find((p: any) => p.user_id === hiring.freelancer_id);
      if (!finder || !freelancer) return error('Both parties must enter legal names before document generation', 422);
      const assets = get(await server.from('signature_assets').select('user_id,storage_path,legal_name').in('user_id',[hiring.finder_id,hiring.freelancer_id]));
      const assetFor = (id: string, name: string) => {
        const asset = assets.find((row: any) => row.user_id === id);
        if (!asset || !asset.storage_path.startsWith(`${id}/signatures/`)) throw new Error('Both parties must upload their own signature images before generating the PDF');
        if (asset.legal_name.trim().toLowerCase() !== name.trim().toLowerCase()) throw new Error('The uploaded signature names must match the saved agreement identities');
        return asset.storage_path as string;
      };
      const paths = [assetFor(hiring.finder_id,finder.legal_name),assetFor(hiring.freelancer_id,freelancer.legal_name)];
      const images = await Promise.all(paths.map(async path => {
        const result = await server.storage.from('agreement-private').download(path);
        if (result.error || !result.data) throw new Error('Could not load a signature image');
        const bytes = new Uint8Array(await result.data.arrayBuffer());
        if (bytes.length > 1024*1024 || bytes.length < 8 || ![137,80,78,71,13,10,26,10].every((part,index) => bytes[index]===part)) throw new Error('Signature images must be PNG files under 1 MB');
        return bytes;
      }));
      const body = bodyFrom(agreement,proposal,finder,freelancer);
      const bodyHash = await sha256(new TextEncoder().encode(body));
      const pdf = await pdfFor(body,{finder:images[0],freelancer:images[1],finderName:finder.legal_name,freelancerName:freelancer.legal_name}), pdfHash = await sha256(pdf);
      const path = `${agreementId}/draft-v1-${pdfHash.slice(0,16)}.pdf`;
      const upload = await server.storage.from('agreement-private').upload(path,pdf,{contentType:'application/pdf',upsert:false});
      if (upload.error) throw new Error(upload.error.message);
      const doc = get(await server.from('agreement_documents').insert({agreement_id:agreementId,version:1,proposal_id:proposal.id,terms_snapshot:proposal.terms,body,sha256:bodyHash,pdf_path:path,pdf_sha256:pdfHash}).select('id').single());
      get(await server.from('agreements').update({status:'awaiting_review'}).eq('id',agreementId));
      get(await server.from('agreement_audit').insert({agreement_id:agreementId,actor_id:auth.user.id,event:'draft_generated',document_id:doc.id,detail:{sha256:bodyHash,pdf_sha256:pdfHash}}));
      return json({documentId:doc.id,sha256:bodyHash,pdfSha256:pdfHash,status:'awaiting_review'});
    }
    if (action === 'evidence') {
      const documentIds = (get(await server.from('agreement_documents').select('id').eq('agreement_id',agreementId)) as {id:string}[]).map(d => d.id);
      const [proposals,documents,audit,signatures,disputes,time,payments,deliverables] = await Promise.all([
        server.from('proposal_versions').select('*').eq('request_id',hiring.id).order('version'),
        server.from('agreement_documents').select('*').eq('agreement_id',agreementId).order('version'),
        server.from('agreement_audit').select('*').eq('agreement_id',agreementId).order('occurred_at'),
        documentIds.length ? server.from('signing_events').select('*').in('document_id',documentIds) : Promise.resolve({data:[],error:null}),
        server.from('agreement_disputes').select('*').eq('agreement_id',agreementId),
        server.from('time_entries').select('*').eq('agreement_id',agreementId),
        server.from('payment_obligations').select('*').eq('agreement_id',agreementId),
        server.from('deliverable_submissions').select('*').eq('agreement_id',agreementId),
      ]);
      const disputeIds = (get(disputes) as {id:string}[]).map(d=>d.id);
      const disputeSubmissions = disputeIds.length ? get(await server.from('dispute_submissions').select('*').in('dispute_id',disputeIds)) : [];
      const manifest = { type:'WhyChooseMe evidence manifest',generatedAt:new Date().toISOString(),legalCertificate:false,
        agreement,hiring,proposalHistory:get(proposals),documents:get(documents),audit:get(audit),signingEvents:get(signatures),disputes:get(disputes),disputeSubmissions,timeEntries:get(time),paymentObligations:get(payments),deliverables:get(deliverables),
        note:'This export is an access-controlled record and hash manifest. Any Section 63 certificate must be prepared by an appropriately authorized person or expert.' };
      return json({...manifest,manifestSha256:await sha256(new TextEncoder().encode(JSON.stringify(manifest)))});
    }
    if (action === 'beginProviderSign') {
      const docs = get(await server.from('agreement_documents').select('id,sha256,pdf_path').eq('agreement_id',agreementId).order('version',{ascending:false}).limit(1));
      const doc = docs[0];
      if (!doc || !doc.pdf_path || agreement.status!=='approved_for_signing' || agreement.compliance_status!=='ready') return error('Document approval and legal prerequisites are incomplete',409);
      const approvals = get(await server.from('agreement_approvals').select('signer_id').eq('document_id',doc.id));
      if (!approvals.some((a:any)=>a.signer_id===hiring.finder_id) || !approvals.some((a:any)=>a.signer_id===hiring.freelancer_id)) return error('Both parties must approve the exact document',409);
      const identity = get(await server.from('agreement_party_identity').select('legal_name').eq('agreement_id',agreementId).eq('user_id',auth.user.id).single());
      try {
        const session = await signingProvider().begin({agreementId,documentId:doc.id,documentSha256:doc.sha256,signerId:auth.user.id,signerLegalName:identity.legal_name,callbackUrl:`${url}/functions/v1/hiring-documents`});
        return json({status:'pending',session});
      } catch (cause) { if (cause instanceof ProviderNotConfigured) return error(cause.message,503); throw cause; }
    }
    return error('Unknown action');
  } catch (cause) { return error((cause as Error).message,500); }
});
