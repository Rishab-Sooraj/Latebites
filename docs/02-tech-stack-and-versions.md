# 02 — Tech stack & versions

This page documents the tech stack used in each app in this repository, including the versions pinned in source control.

> Notes on versions:
>
> - `package.json` uses a mix of pinned versions (e.g. `next: 15.3.6`) and ranged versions (e.g. `^4`). Ranged versions can float on install.
> - For exact resolved versions, use the relevant lockfile (`package-lock.json`, `pubspec.lock`).

## At a glance

| Product | Location | Stack |
|---|---|---|
| Customer website | `src/` (root Next.js app) | Next.js + React + Tailwind + Supabase |
| Admin dashboard | `admin-portal/` | Next.js + React + Tailwind + Supabase |
| Admin dashboard (extended) | `latebites-admin/` | Next.js + React + Tailwind + Supabase |
| Customer mobile app | `mobile_app/` | Flutter + Riverpod + GoRouter + Supabase |
| Restaurant partner app | `latebites-restaurant-app/` | Flutter + Riverpod + Supabase |
| Database | `supabase/` | Supabase Postgres + RLS + Realtime |

## Customer Web (root)

- Package: `package.json`
- Framework: Next.js `15.3.6`
- UI: React `19.2.0`
- Styling: Tailwind CSS `^4` (+ `tw-animate-css` and `tailwindcss-animate`)
- Auth + DB: Supabase (`@supabase/supabase-js` `^2.89.0`, `@supabase/ssr` `^0.8.0`)
- Motion: `framer-motion` `^12.23.24` (+ `motion` / `motion-dom`)
- Payments: Razorpay `^2.9.6` (Stripe SDK is present as a dependency but not currently wired in the customer routes)
- Email: Resend `^6.6.0`
- Maps: Google Maps JS/Geocoding APIs (via script/HTTP calls; key is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

<details>
<summary><strong>Customer Web dependencies (full list)</strong></summary>

## Customer Web (root)

- Name: `app`
- App version: `0.1.0`

### dependencies

| Package | Version |
|---|---|
| @babel/parser | ^7.28.5 |
| @headlessui/react | ^2.2.9 |
| @heroicons/react | ^2.2.0 |
| @hookform/resolvers | ^5.1.1 |
| @libsql/client | ^0.15.15 |
| @number-flow/react | ^0.5.10 |
| @radix-ui/react-accordion | ^1.2.11 |
| @radix-ui/react-alert-dialog | ^1.1.14 |
| @radix-ui/react-aspect-ratio | ^1.1.7 |
| @radix-ui/react-avatar | ^1.1.10 |
| @radix-ui/react-checkbox | ^1.3.2 |
| @radix-ui/react-collapsible | ^1.1.11 |
| @radix-ui/react-context-menu | ^2.2.15 |
| @radix-ui/react-dialog | ^1.1.14 |
| @radix-ui/react-dropdown-menu | ^2.1.15 |
| @radix-ui/react-hover-card | ^1.1.14 |
| @radix-ui/react-label | ^2.1.7 |
| @radix-ui/react-menubar | ^1.1.15 |
| @radix-ui/react-navigation-menu | ^1.2.13 |
| @radix-ui/react-popover | ^1.1.14 |
| @radix-ui/react-progress | ^1.1.7 |
| @radix-ui/react-radio-group | ^1.3.7 |
| @radix-ui/react-scroll-area | ^1.2.9 |
| @radix-ui/react-select | ^2.2.5 |
| @radix-ui/react-separator | ^1.1.7 |
| @radix-ui/react-slider | ^1.3.5 |
| @radix-ui/react-slot | ^1.2.3 |
| @radix-ui/react-switch | ^1.2.5 |
| @radix-ui/react-tabs | ^1.1.12 |
| @radix-ui/react-toggle | ^1.1.9 |
| @radix-ui/react-toggle-group | ^1.1.10 |
| @radix-ui/react-tooltip | ^1.2.7 |
| @react-three/drei | ^10.7.7 |
| @react-three/fiber | ^9.4.2 |
| @supabase/ssr | ^0.8.0 |
| @supabase/supabase-js | ^2.89.0 |
| @tabler/icons-react | ^3.35.0 |
| @tailwindcss/typography | ^0.5.19 |
| @tsparticles/engine | ^3.8.1 |
| @tsparticles/react | ^3.0.0 |
| @tsparticles/slim | ^3.8.1 |
| atmn | ^0.0.28 |
| autumn-js | ^0.1.43 |
| bcrypt | ^6.0.0 |
| better-auth | ^1.3.17 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| cmdk | ^1.1.1 |
| cobe | ^0.6.5 |
| date-fns | ^4.1.0 |
| dotted-map | ^2.2.3 |
| drizzle-kit | ^0.31.6 |
| drizzle-orm | ^0.44.7 |
| embla-carousel-auto-scroll | ^8.6.0 |
| embla-carousel-autoplay | ^8.6.0 |
| embla-carousel-react | ^8.6.0 |
| estree-walker | 2.0.2 |
| framer-motion | ^12.23.24 |
| input-otp | ^1.4.2 |
| lucide-react | ^0.552.0 |
| mini-svg-data-uri | ^1.4.4 |
| motion | ^12.23.24 |
| motion-dom | ^12.23.23 |
| next | 15.3.6 |
| next-themes | ^0.4.6 |
| qss | ^3.0.0 |
| razorpay | ^2.9.6 |
| react | 19.2.0 |
| react-day-picker | ^9.8.0 |
| react-dom | 19.2.0 |
| react-dropzone | ^14.3.8 |
| react-fast-marquee | ^1.6.5 |
| react-hook-form | ^7.60.0 |
| react-hot-toast | ^2.6.0 |
| react-icons | ^5.5.0 |
| react-intersection-observer | ^10.0.0 |
| react-resizable-panels | ^3.0.3 |
| react-responsive-masonry | ^2.7.1 |
| react-syntax-highlighter | ^15.6.1 |
| react-wrap-balancer | ^1.1.1 |
| recharts | ^3.0.2 |
| resend | ^6.6.0 |
| simplex-noise | ^4.0.3 |
| sonner | ^2.0.6 |
| stripe | ^19.2.0 |
| swiper | ^12.0.3 |
| tailwind-merge | ^3.3.1 |
| tailwindcss-animate | ^1.0.7 |
| three | ^0.178.0 |
| three-globe | ^2.43.0 |
| vaul | ^1.1.2 |
| zod | ^4.1.12 |

### devDependencies

| Package | Version |
|---|---|
| @cloudflare/next-on-pages | ^1.13.16 |
| @eslint/eslintrc | ^3.3.1 |
| @opennextjs/cloudflare | ^1.14.7 |
| @tailwindcss/postcss | ^4 |
| @types/google.maps | ^3.58.1 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| @types/react-syntax-highlighter | ^15.5.13 |
| @types/three | ^0.178.0 |
| eslint | ^9.38.0 |
| eslint-config-next | ^16.0.1 |
| tailwindcss | ^4 |
| tw-animate-css | ^1.4.0 |
| typescript | ^5 |
| vercel | ^50.1.3 |

</details>

## Admin portals (Next.js)

There are two admin apps in the repo. They share a very similar stack, but `latebites-admin/` contains additional routes and the support dashboard.

### Admin Portal (`admin-portal/`)

- Next.js `16.1.1`
- React `19.2.3`
- Supabase `@supabase/supabase-js` `^2.90.1`

<details>
<summary><strong>Admin Portal (admin-portal) dependencies</strong></summary>

## Admin Portal (admin-portal)

- Name: `admin-portal`
- App version: `0.1.0`

### dependencies

| Package | Version |
|---|---|
| @supabase/ssr | ^0.8.0 |
| @supabase/supabase-js | ^2.90.1 |
| framer-motion | ^12.26.1 |
| lucide-react | ^0.562.0 |
| next | 16.1.1 |
| react | 19.2.3 |
| react-dom | 19.2.3 |

### devDependencies

| Package | Version |
|---|---|
| @tailwindcss/postcss | ^4 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| eslint | ^9 |
| eslint-config-next | 16.1.1 |
| tailwindcss | ^4 |
| typescript | ^5 |

</details>

### Admin Portal (`latebites-admin/`)

`latebites-admin/` is currently the more feature-complete admin app (adds support dashboard and more admin API routes).

<details>
<summary><strong>Admin Portal (latebites-admin) dependencies</strong></summary>

## Admin Portal (latebites-admin)

- Name: `admin-portal`
- App version: `0.1.0`

### dependencies

| Package | Version |
|---|---|
| @supabase/ssr | ^0.8.0 |
| @supabase/supabase-js | ^2.90.1 |
| framer-motion | ^12.26.1 |
| lucide-react | ^0.562.0 |
| next | 16.1.1 |
| react | 19.2.3 |
| react-dom | 19.2.3 |

### devDependencies

| Package | Version |
|---|---|
| @tailwindcss/postcss | ^4 |
| @types/google.maps | ^3.58.1 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| eslint | ^9 |
| eslint-config-next | 16.1.1 |
| tailwindcss | ^4 |
| typescript | ^5 |

</details>

## Flutter apps

### Customer mobile app (`mobile_app/`)

- App version: `1.0.0+1`
- Dart SDK: `>=3.0.0 <4.0.0` (from `pubspec.yaml`)
- Key packages:
  - `supabase_flutter: ^2.5.0`
  - `flutter_riverpod: ^2.5.1`
  - `go_router: ^14.0.0`
  - `google_fonts: ^6.1.0`
  - `flutter_animate: ^4.5.0`
  - `geolocator: ^13.0.1`, `geocoding: ^3.0.0`, `permission_handler: ^11.3.0`

<details>
<summary><strong>Customer Mobile (mobile_app) dependencies (full list)</strong></summary>

## Customer Mobile (mobile_app)

### dependencies

| Package | Version |
|---|---|
| cached_network_image | ^3.3.1 |
| flutter | sdk: flutter |
| flutter_animate | ^4.5.0 |
| flutter_dotenv | ^5.1.0 |
| flutter_riverpod | ^2.5.1 |
| flutter_svg | ^2.0.10 |
| geocoding | ^3.0.0 |
| geolocator | ^13.0.1 |
| go_router | ^14.0.0 |
| google_fonts | ^6.1.0 |
| google_sign_in | ^6.2.1 |
| image_picker | ^1.0.7 |
| intl | ^0.19.0 |
| permission_handler | ^11.3.0 |
| provider | ^6.1.2 |
| riverpod_annotation | ^2.3.5 |
| shared_preferences | ^2.2.2 |
| shimmer | ^3.0.0 |
| supabase_flutter | ^2.5.0 |
| url_launcher | ^6.2.5 |
| uuid | ^4.5.0 |

### dev_dependencies

| Package | Version |
|---|---|
| build_runner | ^2.4.8 |
| flutter_lints | ^3.0.0 |
| flutter_test | sdk: flutter |
| riverpod_generator | ^2.4.0 |
| riverpod_lint | ^2.3.10 |

</details>

### Restaurant partner app (`latebites-restaurant-app/`)

- App version: `1.0.0+1`
- Dart SDK: `>=3.0.0 <4.0.0`
- Key packages:
  - `supabase_flutter: ^2.3.0`
  - `flutter_riverpod: ^3.2.0`
  - `google_fonts: ^6.1.0`
  - `flutter_animate: ^4.5.0`

<details>
<summary><strong>Restaurant App (latebites-restaurant-app) dependencies (full list)</strong></summary>

## Restaurant App (latebites-restaurant-app)

### dependencies

| Package | Version |
|---|---|
| cupertino_icons | ^1.0.2 |
| flutter | sdk: flutter |
| flutter_animate | ^4.5.0 |
| flutter_dotenv | ^6.0.0 |
| flutter_riverpod | ^3.2.0 |
| google_fonts | ^6.1.0 |
| intl | ^0.19.0 |
| supabase_flutter | ^2.3.0 |

### dev_dependencies

| Package | Version |
|---|---|
| flutter_lints | ^3.0.0 |
| flutter_test | sdk: flutter |

</details>

## Supabase / database

- Postgres with extensions used in migrations:
  - `uuid-ossp` (UUID helpers)
  - `postgis` (geospatial support)
- RLS (Row Level Security) enabled across the core tables.
- Realtime is enabled for support tables (`support_conversations`, `support_messages`) in `005_support_chat_system.sql`.

## External services

- Google Maps APIs: used for reverse geocoding and Places autocomplete.
- Razorpay: used for online payments (create order → verify signature).
- Resend: used for onboarding verification emails and order confirmation emails.
- ZeptoMail: used in the admin codebase for some email flows (env var `ZEPTOMAIL_API_KEY`).
