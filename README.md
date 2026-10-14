# WhyChooseMe

A cross-platform React Native marketplace for discovering local freelancers in Goa. The browser app uses React Native Web and Vite; Android, iOS and Windows project files are included. The visual direction follows the supplied reference: warm cream backgrounds, purple actions, playful lettering, colorful categories and portrait-led freelancer cards.

## Run

```sh
npm install
npm run web
```

Open the printed local URL. Build the static browser bundle with `npm run build:web`; output is in `dist/`.

The root URL reads the configured Supabase project, including the sample rows stored there. Add `?demo` for the local UI walkthrough. The app's public Supabase URL and anon key are in [`src/supabaseConfig.ts`](src/supabaseConfig.ts). Never put a service-role key in client code.

For Android and iOS, use `npm run android` or `npm run ios` after installing the [React Native native toolchain](https://reactnative.dev/docs/set-up-your-environment). For Windows, use `npm run windows` after installing the [React Native Windows dependencies](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies/), including Visual Studio and the .NET SDK. The native app builds were not run in this workspace. Android and Windows JavaScript bundles were generated successfully with Metro.

## Product flows

- Responsive search, categories loaded from [`src/categories.json`](src/categories.json), taluka selection, radius filtering and sorting.
- Full freelancer cards, a “Why Choose Me” profile wall, related profiles and saved profiles. Availability opens from the profile card in a popup; the work gallery uses an evenly spaced 3:2 grid.
- A Goa map using OpenStreetMap tiles, approximate markers, zoom controls and guest-locked pins. Map data needs a production tile provider and validated profile locations before launch.
- Finder email/password signup and sign-in, freelancer profiles with “Other” category suggestions, requests, applications, chat and notifications are wired to Supabase when the schema is installed.
- Finder-only contact details are stored separately. Map and request locations are forced to coarse taluka centres in the database.
- Admins can approve or decline category suggestions from the avatar menu. The separate operations dashboard lists Auth users and their freelancer/finder profiles, with profile editing, ban and premium controls.
- The Supabase project contains eight fictional sample profiles and three fictional requests to review the UI. They have no Auth accounts and cannot receive messages or applications. Their rows remain in the database for manual removal later.
- The local walkthrough persists its draft interactions on this device. Its eight fictional profiles use the same generated portrait assets.

## Supabase setup

The flexible hiring and agreement work is documented in [`docs/HIRING_AND_AGREEMENTS.md`](docs/HIRING_AND_AGREEMENTS.md). The `20261014_hiring_agreements.sql` and `20261014_admin_console.sql` migrations were applied to the linked Supabase project on 2026-10-14. A read-only audit found all 39 public tables present with RLS enabled, and the eight sample freelancers and three sample requests intact. Both `hiring-documents` and `admin-console` Edge Functions are deployed; unauthenticated calls to each returned HTTP 401. The signing provider adapter is still unconfigured, so real eSign is not live.

The linked Supabase project has the three `20261012` SQL files applied: the main schema, sample freelancers, and sample requests. For a new project, apply them in that order before the `20261014` hiring and admin migrations. The main schema creates tables, row-level security policies, triggers, notifications and Realtime publication entries. Supabase Auth email confirmation may require a user to confirm their address before signing in. These files were applied through SQL Editor, so the dashboard's migration history is empty; reconcile that history before using `supabase db push` on the linked project.

The operations dashboard is at `/goa-ops-8c5d76f19b` on the same web app host. It always uses the configured Supabase project. After creating and confirming the Auth email of your choice in Supabase, add its Auth user ID to `public.admins` in SQL Editor:

```sql
insert into public.admins(user_id)
select id from auth.users
where email = 'YOUR_CONFIRMED_EMAIL'
  and email_confirmed_at is not null
on conflict do nothing;
```

Then sign in at the operations URL with that account's existing password. The path is only a private entry point; the Edge Function checks the signed-in user against `public.admins` for every action. The dashboard pages through all Supabase Auth users and shows their freelancer and finder records. Its search and role tabs filter the current page; use Next to inspect subsequent pages. Ban prevents new sign-ins and removes a freelancer from the public directory, although an existing access token may remain valid until it expires. Premium is stored as an entitlement flag and does not change search ranking.

Requests reach same-taluka freelancers immediately, those within 25 km after one day, within 60 km after two days, and matching freelancers throughout Goa after three days. The matching and reach helpers are in [`src/data.ts`](src/data.ts), with database enforcement in the migration.

Before public release, remove the sample entries when you are ready, replace direct OpenStreetMap tiles with a production tile provider, add file uploads for portfolio images, and build native binaries on the corresponding toolchains. Freelancer photos currently accept HTTPS image URLs; portfolio highlights are text. No native installer or app-store package has been built in this workspace.

## Assets and licenses

The portrait contact sheet and palm illustration in `assets/` were generated for this project using the built-in image generation tool. Web typography uses `@fontsource/nunito` and `@fontsource/comic-neue`; native builds currently fall back to platform fonts unless the same families are linked as native font assets. Map tiles are served from OpenStreetMap for development with attribution displayed on the map. Observe the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before any public release.
