# 08 — Deployment & environment variables

This page consolidates local development commands, deployment notes, and environment variables required by each app.

## Customer web (root Next.js app)

### Run locally

From repo root:

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run start
```

### Environment variables

Used across `src/` (found via `process.env.*` references):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server routes that bypass RLS)
- `NEXT_PUBLIC_APP_URL` (used for building verification URLs)
- `RESEND_API_KEY` (email sending)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (maps/places/geocoding)

Payments (Razorpay):

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (client-side Razorpay checkout key)
- `RAZORPAY_KEY_ID` (server-side Razorpay SDK)
- `RAZORPAY_KEY_SECRET` (server-side signature verification)

Templates:

- `.env.example` (basic template)
- `.env.local.example` (includes Clerk keys; Clerk is not currently used in the main customer auth flow)

### Deployment (Netlify)

The repo includes `netlify.toml` for the customer website:

- Build command: `npm install --legacy-peer-deps && npm run build`
- Publish directory: `.next`
- Uses `@netlify/plugin-nextjs`

## Admin portals

### Run locally

Admin Portal:

```bash
cd admin-portal
npm install
npm run dev
```

Latebites Admin:

```bash
cd latebites-admin
npm install
npm run dev
```

### Environment variables (admin)

Shared:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Admin email tooling (latebites-admin):

- `ZEPTOMAIL_API_KEY`

## Flutter apps

### Customer mobile (`mobile_app/`)

```bash
cd mobile_app
flutter pub get
flutter run
```

Environment variables (in `mobile_app/.env`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Template: `mobile_app/.env.example`.

### Restaurant app (`latebites-restaurant-app/`)

```bash
cd latebites-restaurant-app
flutter pub get
flutter run
```

Environment variables (in `latebites-restaurant-app/.env`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Supabase migrations

Migrations live in `supabase/migrations/`. You can apply them either:

- via the Supabase SQL editor (copy/paste), or
- via Supabase CLI (`supabase db push`) if your project is linked

See `supabase/README.md` for a quick setup walkthrough.

## Operational notes

- `next.config.ts` in the customer web app currently ignores TypeScript and ESLint build errors. This can speed iteration but may hide production issues; consider tightening before launch.
- Some core data access routes intentionally use the service role key to bypass RLS. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

