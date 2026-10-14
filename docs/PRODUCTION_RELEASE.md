# Production release status

The web app uses React Native Web, Vite, and the linked Supabase project `aspuzdadkrtwsvihwugv`. The deployed branch is labelled `main Production` in Supabase. There is no local demo mode. The eight example portfolio cards remain visible as read-only examples; example job requests are retained in the database but are no longer shown in the live app.

## Verified in the workspace

- `npm run lint` passes.
- `npm run build` passes and writes `dist/`.
- `npm test -- --runInBand` passes all 27 tests in five suites.
- `admin-console` and `hiring-documents` Edge Functions were updated in the Supabase dashboard. The dashboard reported successful deployment for both on 2026-10-14.
- Supabase Auth secure password change was enabled and the dashboard confirmed the settings update.
- The owner applied `supabase/migrations/20261014_production_media_security.sql` to `main Production`. A read-only dashboard audit found 42 public tables, none without RLS, 42 suspended-user policies and write triggers, the portfolio bucket, calendar RPC, eight example profiles, and three preserved example requests. An additional `20261014_restrict_rpc_grants.sql` change removed Supabase's explicit anonymous EXECUTE grants from account and agreement RPCs. Spot checks confirmed anonymous access denied and authenticated access retained for inquiry decisions and hiring proposals.
- `npm audit --omit=dev` could not reach the npm advisory endpoint from this workspace. Run it from a networked environment before public launch.

## Required before public signups

1. Configure a custom SMTP provider in Supabase Auth and test signup confirmation and password reset on the public domain. The default email service is not suitable for open public registration.
2. Make the Vercel production deployment publicly accessible. The configured Auth Site URL is `https://whychoozeme-sams-projects-76acb8bb.vercel.app/`, but the observed page redirected to Vercel Login (Deployment Protection). Update the Auth Site URL and redirect allowlist if a different public domain is used.
3. Confirm Vercel deployed the latest `main` commit. The production code has been pushed; Vercel should use `npm run build:web`, `dist/`, and `vercel.json` for the admin route and security headers.
4. Create two confirmed Auth accounts on the public domain. Give one a finder profile and the other a freelancer profile. Verify inquiry with an attachment, freelancer approval, chat unlock, contact sharing, offer, and draft agreement. An anonymous request to either Edge Function should return 401.
5. Create and confirm the owner's Auth account, then insert its `user_id` in `public.admins` using the Supabase dashboard. The admin dashboard uses Auth plus this database role; no password is stored in the app.

## Features requiring external services or review

The agreement PDF is a draft for legal review. A recognized eSign provider, payment provider, and legal compliance review are not configured. The app does not claim that visual acknowledgment is a provider verified signature or that a draft is a fully signed agreement. See `HIRING_AND_AGREEMENTS.md` for the exact limitations.

The example portfolio cards are fictional and cannot receive inquiries. Remove them later in Supabase when real freelancer accounts have enough content for the directory.
