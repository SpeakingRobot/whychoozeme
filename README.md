# WhyChooseMe

A cross-platform React Native marketplace for discovering local freelancers in Goa. The browser app uses React Native Web and Vite; Android, iOS and Windows project files are included. The visual direction follows the supplied reference: warm cream backgrounds, purple actions, playful lettering, colorful categories and portrait-led freelancer cards.

## Run

```sh
npm install
npm run web
```

Open the printed local URL. Build the static browser bundle with `npm run build:web`; output is in `dist/`.

The root URL uses the configured Supabase project and shows sample freelancers and requests alongside real entries. Add `?demo=1` to the URL to try the separate local-only preview. The app's public Supabase URL and anon key are in [`src/supabaseConfig.ts`](src/supabaseConfig.ts). Never put a service-role key in client code.

For Android and iOS, use `npm run android` or `npm run ios` after installing the [React Native native toolchain](https://reactnative.dev/docs/set-up-your-environment). For Windows, use `npm run windows` after installing the [React Native Windows dependencies](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies/), including Visual Studio and the .NET SDK. The native app builds were not run in this workspace. Android and Windows JavaScript bundles were generated successfully with Metro.

## Product flows

- Responsive search, categories loaded from [`src/categories.json`](src/categories.json), taluka selection, radius filtering and sorting.
- Full freelancer cards, a “Why Choose Me” profile wall, related profiles and saved profiles.
- A Goa map using OpenStreetMap tiles, approximate markers, zoom controls and guest-locked pins. Map data needs a production tile provider and validated profile locations before launch.
- Finder email/password signup and sign-in, freelancer profiles with “Other” category suggestions, requests, applications, chat and notifications are wired to Supabase when the schema is installed.
- Finder-only contact details are stored separately. Map and request locations are forced to coarse taluka centres in the database.
- Admins can approve or decline category suggestions from the avatar menu. Approved categories join the directory list.
- The Supabase project contains eight fictional sample profiles and three fictional requests to review the UI. They are marked “Sample,” have no Auth accounts, and cannot receive messages or applications.
- The `?demo=1` preview persists its draft interactions on this device. Its eight fictional profiles use the same generated portrait assets.

## Supabase setup

The linked Supabase project has the three migrations in `supabase/migrations/` applied: the main schema, sample freelancers, and sample requests. For a new project, apply them in that order in Supabase SQL Editor. The main schema creates tables, row-level security policies, triggers, notifications and Realtime publication entries. Supabase Auth email confirmation may require a user to confirm their address before signing in.

To make a user an admin, after they have registered, insert their Auth user UUID into `public.admins` from the SQL Editor:

```sql
insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
```

Requests reach same-taluka freelancers immediately, those within 25 km after one day, within 60 km after two days, and matching freelancers throughout Goa after three days. The matching and reach helpers are in [`src/data.ts`](src/data.ts), with database enforcement in the migration.

Before public release, hide or remove the marked sample entries, replace direct OpenStreetMap tiles with a production tile provider, add file uploads for portfolio images, and build native binaries on the corresponding toolchains. Freelancer photos currently accept HTTPS image URLs; portfolio highlights are text. No native installer or app-store package has been built in this workspace.

## Assets and licenses

The portrait contact sheet and palm illustration in `assets/` were generated for this project using the built-in image generation tool. Web typography uses `@fontsource/nunito` and `@fontsource/comic-neue`; native builds currently fall back to platform fonts unless the same families are linked as native font assets. Map tiles are served from OpenStreetMap for development with attribution displayed on the map. Observe the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before any public release.
