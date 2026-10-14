# Hiring and agreement module

This module uses the existing React Native, React Native Web, and Supabase stack. It does not introduce Next.js. The browser uses the linked Supabase project for accounts, inquiries, chat, hiring, and agreements. The retained example portfolio cards are read-only.

## Install in another Supabase project

1. Apply the `20261012` migrations, then the `20261014` migrations in filename order in a test project. Apply `20261014_production_media_security.sql` after the inquiry gate and admin migrations.
2. Deploy `supabase/functions/hiring-documents` with Supabase CLI. Supply `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as Edge Function secrets, never in the app bundle.
3. Start the app with `npm run web` and open the root URL. Register two separate confirmed Auth users. Both need finder profiles; the freelancer also needs a freelancer profile.
4. On the freelancer's own public profile, add services and pricing choices and set weekly capacity. The Finder can send a custom offer from that profile. Use the avatar menu's **Hiring & agreements** screen to review offers and generate an agreement after exact acceptance.
5. Each party supplies a legal name. The Edge Function generates one private draft PDF from the accepted proposal snapshot. Both parties can inspect the same document hash, download the PDF through a short lived signed URL, and approve the text.

The migration was applied through SQL Editor to linked project `aspuzdadkrtwsvihwugv` on 2026-10-14 after the owner approved its `main Production` branch label. A read-only query verified 25 new tables, RLS on all 25, the proposal and activation RPCs, and the private agreement bucket. Supabase's migration history remains empty because the project has been managed through SQL Editor; reconcile it before using `supabase db push`. The `hiring-documents` Edge Function was deployed from this workspace and returned HTTP 401 to an unauthenticated test request. An authenticated end-to-end agreement run still requires confirmed test users; provider-verified signing requires an actual eSign provider integration.

## Core invariants

- Every counteroffer is a new proposal row. The newest version alone can be accepted, and accepted terms are immutable to app users.
- Sending an offer does not reserve time, authorize payment, or activate work.
- Exclusive and appointment reservations use a PostgreSQL exclusion constraint. Activation runs under a freelancer scoped advisory lock and checks leave, maximum active projects, weekly capacity, and queue length.
- Flexible capacity allocations and actual billable time are separate. Hourly entries use weekly hour and total money caps; the client reviews each entry.
- Public availability exposes only aggregate capacity, project count, queue count, and reserved windows, not identities or private prices.
- Draft PDF bytes and SHA-256 hashes are stored in a private bucket. Access to documents, audit events, and disputes is limited to the two parties.
- A profile signature image is a private visual asset only. It is never automatically placed on a contract or counted as signing consent.
- Visual acknowledgment is recorded separately from provider verified eSign and never produces `fully_signed`.
- Activation requires `fully_signed`, compliance `ready`, and any payment obligations authorized. No function in this module fabricates those states.

## External integrations still required

**Recognized eSign:** The CCA explains that online eSign is provided through licensed/empanelled providers; application owners must arrange integration with a provider. `supabase/functions/hiring-documents/signingProvider.ts` defines the provider session, callback and document-verification boundary. Its current adapter explicitly reports unavailable until a specific provider contract, documented API, credentials, verified callback scheme, certificate validation, and executed PDF handling are implemented. No provider transaction or cryptographic signature is simulated. See [CCA eSign guidance](https://cca.gov.in/eSign.html), [how to avail services](https://www.cca.gov.in/avail_service.html), and [empanelled providers](https://cca.gov.in/service-providers.html).

**Payments:** `payment_obligations` records amounts and honest `unfunded`/`authorization_pending` statuses. A provider adapter must authorize and reconcile collection, refunds, taxes, invoices and payouts. This project does not have a payment provider, and nothing is labelled escrow.

**Legal review:** The draft renderer records accepted commercial terms and marks the result `legal_review_required`. An Indian lawyer must review the template clauses, category specific terms, legal identities and signatory authority, governing law, liability, IP, cancellation and refunds, and state specific stamp or registration requirements. An authorized operator must set a reviewed compliance policy before enabling signing; no client function can mark compliance ready. The [Indian Contract Act](https://www.indiacode.nic.in/bitstream/123456789/2187/2/A187209.pdf), [Indian Stamp Act](https://www.indiacode.nic.in/bitstream/123456789/9184/1/indian_stamp_act_1899.pdf), and [Bharatiya Sakshya Adhiniyam section 63](https://www.indiacode.nic.in/indiacode/bitstream/123456789/20063/1/aa202347.pdf) should be included in that review. Check applicable state rules and the current [MeitY DPDP rules and commencement timeline](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit) when deploying.

**Evidence:** The authenticated export contains the offer chain, accepted snapshot, document hashes, audit records, signing events, disputes, time entries, deliverables, and payment obligation records. It is a manifest, not a Section 63 certificate or a promise of admissibility. A suitably authorized person or expert must prepare any required certificate.

## Current functional limits

- The agreement PDF is a legally unreviewed draft. Its PDF renderer uses standard Latin fonts and transliterates unsupported characters. Before production, embed fonts suitable for Indian legal names and languages and review the layout.
- Recurring commitments currently reserve weekly effort, not individual recurring appointment instances or holiday exceptions. The rule and exception tables provide the base data model for that scheduler.
- Agreement amendments have a versioned data table but no execution UI or re-signing transition yet. Do not change an active agreement in place.
- Native signature drawing/upload is not yet supported; the web app supports canvas drawing and PNG/JPEG upload to private storage.
- No desktop time tracker, payment provider, stamp provider, KYC provider, eSign provider, or transactional signed-PDF assembly is configured.
- The migration and Edge Function require an authenticated integration run. Local automated tests validate pricing and date logic, but do not exercise PostgreSQL RLS or concurrent transactions.
