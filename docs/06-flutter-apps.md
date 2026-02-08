# 06 — Flutter apps

This repo contains two Flutter apps:

- `mobile_app/` — customer mobile app
- `latebites-restaurant-app/` — restaurant partner app

Both use Supabase as the backend and load credentials from a local `.env` file via `flutter_dotenv`.

## Customer mobile app (`mobile_app/`)

### Tech stack

- Flutter (Material 3 enabled)
- Dart SDK: `>=3.0.0 <4.0.0`
- State management: `flutter_riverpod`
- Navigation: `go_router`
- Backend: `supabase_flutter`
- UI/motion: `google_fonts`, `flutter_animate`
- Location: `geolocator`, `geocoding`, `permission_handler`

### Design system

The app explicitly mirrors the customer web design system:

- Theme: `mobile_app/lib/config/theme.dart`
  - Uses Cormorant Garamond + Plus Jakarta Sans
  - Premium spacing + typography scales
  - Branded colors + semantic tokens

Reusable “cinematic” UI building blocks:

- Reveal text animation: `mobile_app/lib/widgets/reveal_text.dart`
- Section wrapper / layout: `mobile_app/lib/widgets/section_wrapper.dart`

### Project layout

Key folders/files:

- `mobile_app/lib/main.dart` — entry point
- `mobile_app/lib/config/` — theme + supabase init
- `mobile_app/lib/screens/` — app pages (landing, auth, browse, bag detail, orders, profile)
- `mobile_app/lib/services/` — Supabase/auth/location helpers
- `mobile_app/lib/providers/` — Riverpod providers (e.g. location)
- `mobile_app/lib/widgets/` — shared UI widgets

### Environment variables

`mobile_app/.env` must include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Template file: `mobile_app/.env.example`.

### Existing app docs

The mobile app already contains setup docs you can follow:

- `mobile_app/QUICKSTART.md`
- `mobile_app/FLUTTER_SETUP.md`
- `mobile_app/DATABASE_SETUP.md`
- `mobile_app/LOCATION_NOTIFICATIONS_SETUP.md`

## Restaurant partner app (`latebites-restaurant-app/`)

### Tech stack

- Flutter (Material 3 enabled)
- Dart SDK: `>=3.0.0 <4.0.0`
- State management: `flutter_riverpod`
- Backend: `supabase_flutter`
- UI/motion: `google_fonts`, `flutter_animate`

### UX scope

The restaurant app focuses on operational actions:

- Login + account management
- Toggle “online/offline” availability
- Create daily bag listings (modal)
- Update bag quantities
- View today’s orders and compute earnings estimates

Key screens/widgets:

- `latebites-restaurant-app/lib/screens/dashboard_screen.dart`
- `latebites-restaurant-app/lib/widgets/add_bag_modal.dart`
- `latebites-restaurant-app/lib/widgets/bag_card.dart`
- `latebites-restaurant-app/lib/widgets/order_card.dart`

### Design system

Restaurant app uses a dark UI theme:

- Theme: `latebites-restaurant-app/lib/config/theme.dart`
- Branded emerald primary on zinc surfaces (dashboard/ops feel).

### Environment variables

`latebites-restaurant-app/.env` must include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

The initialization happens in `latebites-restaurant-app/lib/config/supabase_config.dart`.

