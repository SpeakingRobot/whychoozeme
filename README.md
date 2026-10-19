# WhyChooseMe

A cross-platform React Native directory for discovering local freelancers in Goa. Finders and Freelancers connect by direct chat or by a Freelancer's optional public WhatsApp link. The site does not manage agreements, payments or delivery. The browser app uses React Native Web and Vite; Android, iOS and Windows project files are included.

## Run

```sh
npm install
npm run web
```

Open the printed local URL. Build the static browser bundle with `npm run build:web`; output is in `dist/`.

The root URL reads the configured Supabase project. There is no local demo mode. The app's public Supabase URL and anon key are in [`src/supabaseConfig.ts`](src/supabaseConfig.ts). Never put a service-role key in client code. Read [`docs/PRODUCTION_RELEASE.md`](docs/PRODUCTION_RELEASE.md) before public deployment.

For Android and iOS, use `npm run android` or `npm run ios` after installing the [React Native native toolchain](https://reactnative.dev/docs/set-up-your-environment). For Windows, use `npm run windows` after installing the [React Native Windows dependencies](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies/), including Visual Studio and the .NET SDK. The native app builds were not run in this workspace. Android and Windows JavaScript bundles were generated successfully with Metro.

## Product flows

- Responsive search, categories loaded from [`src/categories.json`](src/categories.json), taluka selection, radius filtering and sorting.
- Freelancer cards, related profiles and saved profiles. The work gallery groups descriptions, photos, video, documents and links.
- A Goa map using OpenStreetMap tiles, approximate markers, zoom controls and guest-locked pins. Map data needs a production tile provider and validated profile locations before launch.
- Email OTP signup and sign-in, Freelancer profiles, requirements, applications, direct chats and notifications are wired to Supabase. A Finder can message a Freelancer directly. Freelancers can approach matching requirement posts; Finders can inspect applicants and connect through chat. Finders who have sent a direct message may leave community feedback; this is not a verified record of completed work.
- Freelancers may enter an international WhatsApp number in their profile editor. This saves a public `wa.me` link in their profile and shows a WhatsApp button to visitors. Existing private contact records stay private. Freelancers can also choose to share private contact details in chat. Map and request locations are forced to coarse taluka centres in the database.
- Admins can approve or decline category suggestions from the avatar menu. The separate operations dashboard lists Auth users and their freelancer/finder profiles, with profile editing, ban and premium controls.
- The Supabase project retains eight fictional example profiles to review the UI. They are marked as examples and cannot receive messages or applications. Three old example requests remain in the database but are not displayed by the app.

## Supabase setup

The previous hiring and agreement system is historical and is no longer linked from the app. Existing records must be retained and handled separately. Apply [`20261019_direct_connections.sql`](supabase/migrations/20261019_direct_connections.sql) before releasing this UI: it lets Finders open a direct chat, calculates response speed from a Freelancer's first reply to the first message, adds community reviews, and blocks creation of new platform-managed hiring records. The application will not show existing chats correctly until that migration is applied.

The linked Supabase project has the three `20261012` SQL files and the later `20261014` and `20261019` migrations tracked in this repository. These were applied through SQL Editor, so reconcile the dashboard's migration history before using `supabase db push`. Do not run legacy hiring flows in new deployments. Direct messaging requires two confirmed accounts for an end-to-end live test.

The operations dashboard is at `/goa-ops-8c5d76f19b` on the same web app host. It always uses the configured Supabase project. After creating and confirming the Auth email of your choice in Supabase, add its Auth user ID to `public.admins` in SQL Editor:

```sql
insert into public.admins(user_id)
select id from auth.users
where email = 'YOUR_CONFIRMED_EMAIL'
  and email_confirmed_at is not null
on conflict do nothing;
```

Then sign in at the operations URL with that account's email OTP. The site's Admin console link opens this same dashboard. The path is only a private entry point; the Edge Function checks the signed-in user against `public.admins` for every action. The dashboard pages through all Supabase Auth users and shows their freelancer and finder records. Its search and role tabs filter the current page; use Next to inspect subsequent pages. Select a user, then choose **Delete user & data…** beside Ban to remove an eligible test account from Supabase Auth and its related data. Type the user's email to confirm. Admin accounts and accounts with hiring or agreement history cannot be deleted with this test cleanup. Ban prevents new sign-ins and removes a freelancer from the public directory, although an existing access token may remain valid until it expires. Premium is stored as an entitlement flag and does not change search ranking.

Requests reach same-taluka freelancers immediately, those within 25 km after one day, within 60 km after two days, and matching freelancers throughout Goa after three days. The matching and reach helpers are in [`src/data.ts`](src/data.ts), with database enforcement in the migration.

Before public release, remove sample entries when ready, replace direct OpenStreetMap tiles with a production tile provider, review the Terms & privacy text with local counsel, and build native binaries on the corresponding toolchains. No native installer or app-store package has been built in this workspace.

## Assets and licenses

The portrait contact sheet and palm illustration in `assets/` were generated for this project using the built-in image generation tool. Web typography uses `@fontsource/nunito` and `@fontsource/comic-neue`; native builds currently fall back to platform fonts unless the same families are linked as native font assets. Map tiles are served from OpenStreetMap for development with attribution displayed on the map. Observe the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before any public release.
