-- Supabase grants EXECUTE to anon explicitly by default. PUBLIC revocation alone
-- does not remove that grant. These account and agreement RPCs require a login.
begin;
revoke execute on function
  public.my_freelancer_inquiries(),
  public.approved_inquiry_between(uuid,uuid),
  public.decide_freelancer_inquiry(uuid,text,text),
  public.send_hiring_proposal(uuid,uuid,uuid,uuid,jsonb),
  public.decide_hiring_proposal(uuid,text),
  public.create_hiring_agreement(uuid),
  public.open_agreement_dispute(uuid,text,text,text,bigint),
  public.submit_dispute_response(uuid,text),
  public.approve_agreement_document(uuid),
  public.acknowledge_agreement_document(uuid),
  public.activate_hiring_agreement(uuid),
  public.cancel_hiring_agreement(uuid),
  public.submit_hourly_entry(uuid,timestamptz,timestamptz,text),
  public.review_hourly_entry(uuid,text),
  public.submit_deliverable(uuid,text,text),
  public.review_deliverable(uuid,text),
  public.is_hiring_party(uuid),
  public.is_agreement_party(uuid),
  public.is_active_user()
from anon;
commit;
