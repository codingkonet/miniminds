# MiniMINDS

Bilingual (French / English) learning web app for kids aged 3-8, with flashcards, audio pronunciation, matching game, quizzes, stories, songs, stars/badges, a parent dashboard, and a full Admin Panel linked to Supabase.

## Run locally (Demo Mode - no setup)

```powershell
cd C:\Users\ouag\MiniMINDS
python -m http.server 5174 --bind 127.0.0.1
```

Open http://127.0.0.1:5174

- Landing page (public home with copyright footer): http://127.0.0.1:5174/
- Kids app: http://127.0.0.1:5174/#/app (the Android app opens here directly)
- Parent dashboard: `#/parent` - PIN `1234`
- Admin panel (hidden - no button in the kids header, only a small "Admin" link in the homepage footer): direct link http://127.0.0.1:5174/#/admin - `admin@miniminds.school` / `demo1234` (offline Demo Mode only). Bookmark this link. For Supabase Mode, sign in with your Supabase Auth admin user (password is never stored in code) and set its `profiles.role` to `admin`.

## Connect Supabase (real backend)

1. Create a free project at https://supabase.com
2. In Supabase: **SQL Editor** - paste and run `supabase/schema.sql` (creates all tables, RLS, storage buckets `images`/`audio`, and seed categories).
3. In Supabase: **Authentication > Users > Add user** - create your admin user.
4. Run in SQL Editor: `update public.profiles set role='admin' where email='your-email@example.com';`
5. In Supabase: **Settings > API** - copy Project URL + anon public key into `supabase-config.js`:

```js
// Already linked (2026-10-24):
window.MINIMINDS_SUPABASE = { url: "https://ofqgfenkuiujuhxqmpsp.supabase.co", anonKey: "eyJ... (in supabase-config.js)" };
```

Remaining one-time setup in Supabase dashboard for this project:
1. SQL Editor (https://supabase.com/dashboard/project/ofqgfenkuiujuhxqmpsp/sql/new): paste and Run `supabase/schema.sql`.
2. Authentication > Users > Add user: `admin@miniminds.school` / <your-password>, enable Auto Confirm User.
3. SQL Editor: `update public.profiles set role='admin' where email='admin@miniminds.school';`

6. Reload the app. The header/Admin now shows "Supabase connected". Admin CRUD, stories, songs and progress write to Supabase. If Supabase tables are empty, the app falls back to demo content and tells you to import the SQL.

Tables: `profiles`, `kid_profiles`, `categories`, `vocabulary`, `quizzes`, `stories`, `songs`, `progress`, `badges`, `kid_badges`, `app_settings`.

## Features

- EN/FR toggle for the whole UI, flashcards show both languages with text-to-speech (`en-US` / `fr-FR`)
- Age filter 3-5 / 6-8, 12 categories (incl. **Coloring / Coloriage**), 170 words (full A-Z alphabet, numbers 1-20), 10-question quizzes + Big Mix Quiz
- Pictures: admins can **upload pictures** (file picker) or paste an image URL when editing a category / word / story / song. Uploads go to Supabase Storage bucket `images` (auto-compressed to 900px JPEG); in Demo Mode the compressed image is stored locally. Pictures replace emojis on flashcards, quiz, matching game, category cards, stories and songs
- Games: Flashcards, Quiz (stars by score), Matching game
- Stories and songs with read-aloud, Rewards page with badges
- **YouTube learning videos** (`#/videos`): admins add a video from the Admin panel (paste any YouTube link - watch, youtu.be or shorts; live thumbnail preview). Kids see a bilingual video grid and tap a card to play it in an in-app modal using the privacy-enhanced `youtube-nocookie.com` embed (no YouTube site around it, autoplay on open, tap ✕ or outside to close). 5 kid-safe learning videos are seeded. Stored as JSON in Supabase `app_settings` key `videos` (like monetization - no extra table needed)
- Parent dashboard (PIN protected): stars, progress by category, reset
- Admin: dashboard stats, CRUD for categories / vocabulary / stories / songs / videos / badges, users view, settings (app name, parent PIN, maintenance), search/filter tables, delete confirmation
- Accounts: `#/signup` / `#/login` (Supabase Auth, parent accounts). The app is **fully free**: every category, story, song and video is unlocked for everyone. If a paid plan is ever re-added in Admin > Monetization, the upgrade flow (login required, Premium-locked categories, checkout, "Go Premium" buttons) comes back automatically via `hasPaidPlan()`.
- Android is **online-first**: the app opens the live site (`https://codingkonet.github.io/miniminds/#/app`) and falls back to the bundled copy when offline, so web updates reach Android without a new APK. The `gh-pages` branch hosts that site - sync it on every push with `git push origin main:gh-pages`.
- Monetization (Admin > Monetization): the app currently ships with **only a Free plan** (no Premium, nothing locked). The editor still supports ads on/off + placements + custom banner/code, Free/Paid plans (price, currency, features EN/FR), paid-category locks, payment methods - PayPal (email/link), Stripe Payment Link, bank transfer, custom methods - so a paid plan can be re-enabled anytime. Public pages: `#/pricing` (shows a "everything is free" banner while no paid plan exists), `#/checkout/<plan>`. Config is saved to Supabase `app_settings` key `monetization` (run `supabase/monetization.sql` for optional plans/payment_methods/subscriptions tables used by future payment webhooks)

## Deploy online (free)

Static site - drag the `MiniMINDS` folder onto https://app.netlify.com/drop , or use Vercel / Cloudflare Pages / GitHub Pages. No build step.

## Files

- `index.html` - entry point
- `app.js` - kids app + parent + admin logic, Supabase data layer
- `data.js` - seed content mirroring the Supabase tables
- `style.css` - playful kid-friendly design + admin layout
- `supabase-config.js` - paste your Supabase URL / anon key here
- `supabase/schema.sql` - full database setup
