# Email OTP rollout

The `codex/otp-auth` branch replaces password forms in the public and admin web pages with an eight-digit email-code flow. It requests codes through `signInWithOtp` and verifies them through `verifyOtp`. Public sign-in sets `shouldCreateUser: false`; sign-up includes the Finder/Freelancer choice in user metadata. The app does not open an account session until Supabase reports a confirmed email.

On 2026-10-16, the Production Supabase project had **Confirm email enabled**, an **eight-digit OTP length**, and Brevo custom SMTP enabled. Supabase accepted a test OTP request after the sender IP was authorized in Brevo. Inbox delivery and code verification still need to be checked. The **Magic link or OTP** email template contains `{{ .Token }}`. The **Confirm sign up** template still needs to be switched from `{{ .ConfirmationURL }}` to `{{ .Token }}` as part of the app rollout.

Before rollout:

1. Confirm the Brevo sender remains configured in Supabase Authentication → Emails → SMTP Settings, and a code arrives in the recipient inbox. Keep SMTP credentials in Supabase only.
2. In **Confirm sign up**, replace the confirmation link with a clearly labeled `{{ .Token }}` code. **Magic link or OTP** already uses the token.
3. Send and verify a code for a new Finder, a new Freelancer, and an existing confirmed user. Confirm no app profile or session is usable before code verification. Check resend and an invalid/expired code.
4. Apply `supabase/migrations/20261016_email_otp_access_token_hook.sql`, then configure `public.whychoozeme_email_otp_access_token` as the SQL **Custom Access Token** hook in Authentication → Auth Hooks. The migration alone does not activate the hook. Test that a direct password sign-in is rejected and OTP sign-in works. Removing password forms does not by itself disable API password sign-in for older accounts. Consider existing sessions separately.
5. Deploy the app and verify the two templates and sender in Production. Only then merge this branch to `main`.

Supabase's built-in OTP creates an **unconfirmed Auth user record** when a new email requests a sign-up code. It issues no usable session until verification. If the requirement means that even an unconfirmed Auth row must not exist, that requires a custom pending-registration service rather than Supabase's built-in `signInWithOtp`.
