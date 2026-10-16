# Email OTP rollout

The `codex/otp-auth` branch replaces password forms in the public and admin web pages with an eight-digit email-code flow. It requests codes through `signInWithOtp` and verifies them through `verifyOtp`. Public sign-in sets `shouldCreateUser: false`; sign-up includes the Finder/Freelancer choice in user metadata. The app does not open an account session until Supabase reports a confirmed email.

Do not merge or deploy this branch until email-code delivery is ready. On 2026-10-16, the Production Supabase project had **Confirm email enabled**, an **eight-digit OTP length**, and **custom SMTP disabled**. Both default email templates showed `{{ .ConfirmationURL }}` links. The dashboard disabled editing those templates until custom SMTP is enabled. The built-in sender is limited to organization team addresses and two emails per hour; it cannot support public sign-in.

Before rollout:

1. Connect a verified SMTP sender in Supabase Authentication → Emails → SMTP Settings. Keep its credentials in Supabase only.
2. In both **Confirm sign up** and **Magic link or OTP** email templates, replace the link with a clearly labeled `{{ .Token }}` code.
3. Send and verify a code for a new Finder, a new Freelancer, and an existing confirmed user. Confirm no app profile or session is usable before code verification. Check resend and an invalid/expired code.
4. Apply `supabase/migrations/20261016_email_otp_access_token_hook.sql`, then configure `public.whychoozeme_email_otp_access_token` as the SQL **Custom Access Token** hook in Authentication → Auth Hooks. The migration alone does not activate the hook. Test that a direct password sign-in is rejected and OTP sign-in works. Removing password forms does not by itself disable API password sign-in for older accounts. Consider existing sessions separately.
5. Deploy the app and verify the two templates and sender in Production. Only then merge this branch to `main`.

Supabase's built-in OTP creates an **unconfirmed Auth user record** when a new email requests a sign-up code. It issues no usable session until verification. If the requirement means that even an unconfirmed Auth row must not exist, that requires a custom pending-registration service rather than Supabase's built-in `signInWithOtp`.
