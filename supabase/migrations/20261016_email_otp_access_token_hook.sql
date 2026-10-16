-- Activate this function in Authentication > Auth Hooks only after OTP emails
-- have been delivered and verified end to end. Creating it alone changes no login behavior.
create or replace function public.whychoozeme_email_otp_access_token(event jsonb)
returns jsonb
language plpgsql
as $$
begin
  if event->>'authentication_method' = 'password' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Password sign-in is disabled. Request an email code instead.'
    ));
  end if;

  return jsonb_build_object('claims', event->'claims');
end;
$$;

revoke execute on function public.whychoozeme_email_otp_access_token(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.whychoozeme_email_otp_access_token(jsonb) to supabase_auth_admin;
