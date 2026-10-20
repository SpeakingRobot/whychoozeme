# Changelog

## v1.1.0 — 21 October 2026

WhyChoozeMe now focuses on helping Finders and Freelancers discover each other and connect directly. Work agreements, signatures, and payment tracking are no longer part of the active site flow.

### New and improved

- Finders can start an in-app chat with a Freelancer directly. A WhatsApp button appears when the Freelancer adds a number to their profile, and My space prompts them to add one.
- The chat has a conversation sidebar, incoming-message unread counts, day labels, and private PDF and image attachments. Opening a conversation clears its unread count.
- Freelancer profiles show services, work mode, portfolio, and community reviews. The site also tracks profile views and saves for the Freelancer's activity view.
- My space has a refreshed profile header, completion guide, WhatsApp prompt, and shortcuts for requirements, profiles, chats, and saved creatives.
- Notifications are grouped into All, Messages, Activity, and System, with controls to mark them read. Matching Freelancers receive alerts about new Finder requirements.
- Admins can inspect accounts and listings, flag an account or specific content with a reason and confirmation step, review moderation history, and dismiss flags. Content under review is hidden from public listings and shown to its owner with the reason. The admin console also supports test-account deletion, including Auth data, subject to its existing safety restrictions.

### Fixes

- Corrected profile links in discovery cards and repaired the chat permission error that prevented new messages.
- Fixed unread badges so sent messages do not count as unread for the sender, and opening a chat clears the recipient's badge.
- Fixed message read updates, Chrome back navigation, and duplicate review text left in the form after submission.
- Clarified the work-mode label on service cards and improved the wording and visibility of connection options.

Verification: web build and lint passed; all 53 automated tests passed. The admin confirmation flow and My space were checked in the local browser without flagging a real account or listing.

## v1.0.0 — 19 October 2026

- Made account setup steps clearer and showed which details are complete.
- Required a saved private signature image before finishing the signature step. Clarified that saving the image does not sign or accept an agreement.
- Added a choice to keep freelancer contact details private or display them publicly. Private is the default; email, phone, and WhatsApp appear on the public profile only after the freelancer opts in.
- Let freelancers move services up or down to choose their display order.
- Applied the contact visibility and service ordering database migration to Production.

Verification: web build, lint, and all 46 tests passed.
