# 05 — Admin portals

This repo contains two Next.js admin apps: `admin-portal/` and `latebites-admin/`.

## Why two admin apps?

Both apps share the same general purpose (ops dashboards over Supabase data), but `latebites-admin/` is currently more feature-complete:

- Adds **support chat inbox** (`/dashboard/support`)
- Adds additional admin APIs (freeze/revoke admins, restaurant status/strike, bag delete, etc.)

If you’re choosing one to deploy and maintain, treat `latebites-admin/` as the primary candidate unless you intentionally want a smaller surface area.

## Tech stack (both admin apps)

- Next.js App Router
- React
- Tailwind CSS
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Motion: `framer-motion`
- Icons: `lucide-react`

Versions are documented in [02 — Tech stack & versions](./02-tech-stack-and-versions.md).

## Route map (admin-portal)

| Route | Purpose |
|---|---|
| `/` | Admin login/entry |
| `/change-password` | Forced password change flow |
| `/dashboard` | Main dashboard |
| `/dashboard/restaurants` | Restaurant list |
| `/dashboard/restaurants/new` | Create restaurant |
| `/dashboard/restaurants/[id]` | Restaurant details |
| `/dashboard/orders` | Orders list |
| `/dashboard/customers` | Customers list |
| `/dashboard/onboarding` | Restaurant onboarding queue |
| `/dashboard/admins` | Admin management |

## Route map (latebites-admin)

`latebites-admin/` includes all of the above plus:

| Route | Purpose |
|---|---|
| `/dashboard/support` | Support inbox + chat |

And additional API routes under `latebites-admin/src/app/api/...` for admin actions.

## Authentication model (admin)

The admin login flow in `latebites-admin/src/app/page.tsx`:

1. Calls Supabase Auth’s password grant endpoint directly:
   - `POST {NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`
2. Sets the session in the Supabase client.
3. Validates the user is an active admin by querying `admins`:
   - checks `is_active`
   - blocks if `frozen_at` or `revoked_at`
   - routes to `/change-password` if `must_change_password` is set

**Important:** The `admins` table is required for admin access and is not defined in `supabase/migrations/` (confirm it exists in your Supabase project).

## Support dashboard (latebites-admin)

### UX structure

The support page (`latebites-admin/src/app/dashboard/support/page.tsx`) is a two-panel inbox:

- **Left:** conversation list, filterable by status (`open`, `in_progress`, `resolved`, `closed`)
- **Right:** message thread + composer + quick replies
- Status updates (e.g. `open → in_progress → resolved`) are handled in the UI and persisted to Supabase.

### Data model

Defined in `supabase/migrations/005_support_chat_system.sql`:

- `support_conversations` (customer + optional order + status)
- `support_messages` (conversation messages, sender type)

### Data access pattern (important)

The admin support UI uses service-role API routes in `latebites-admin/src/app/api/support/...`:

- `GET /api/support/conversations?status=...`
- `PATCH /api/support/conversations` (update status)
- `GET /api/support/messages?conversation_id=...`
- `POST /api/support/messages` (send admin message)

These routes use `SUPABASE_SERVICE_ROLE_KEY` so they can:

- read all conversations/messages
- enrich conversations with customer and order data
- update status/admin assignment

### Realtime + reliability

Both admin and customer chat UIs subscribe to Supabase Realtime `INSERT` events for `support_messages`, and also run polling as a fallback. This improves reliability when:

- realtime subscription is slow to connect,
- a tab sleeps in the background,
- network conditions are unstable.

## Environment variables (admin)

Common:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (location picker components)

Admin email tooling (latebites-admin):

- `ZEPTOMAIL_API_KEY`

See [08 — Deployment & environment variables](./08-deployment-and-env.md) for a consolidated list.

