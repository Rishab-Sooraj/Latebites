# 04 — Customer web pages & flows

This page documents the customer website routes (UI + UX intent), plus the main data/API dependencies each page relies on.

## Route map

| Route | Purpose |
|---|---|
| `/` | Manifesto landing page + restaurant onboarding form |
| `/browse` | Location-first restaurant/bag discovery |
| `/restaurant/[id]` | Restaurant details + list of bags + add-to-cart |
| `/bag/[id]` | Bag details (pricing, pickup window, availability) |
| `/cart` | Checkout (pay at pickup / Razorpay) |
| `/checkout/[id]` | Single-bag checkout (currently simplified) |
| `/orders` | Customer order history |
| `/orders/[id]` | Order detail + pickup countdown |
| `/order-success` | Post-checkout confirmation + OTP |
| `/help` | Support entry (pick order/issue) |
| `/help/chat` | Support chat (order-linked) |
| `/profile` | Customer profile |
| `/signup` | Email/password signup page |
| `/verify-otp` | Phone OTP verification page |
| `/verify` | Email verification page (restaurant onboarding) |
| `/dashboard` | Customer dashboard (stats + quick actions) |
| `/customer/dashboard` | Alternate “minimal” dashboard |
| `/restaurant/dashboard` | Basic restaurant dashboard (web) |
| `/admin` | Internal onboarding responses table |
| `/test-auth` | Supabase auth diagnostics page |

## `/` — Landing (Manifesto)

- File: `src/app/page.tsx`
- UX goals:
  - Storytelling + trust building (premium hero + section narrative)
  - Clear CTA to start ordering (authenticated users) or sign in
  - Restaurant onboarding capture form
- Key UI patterns:
  - Full-screen hero with background image, gradient overlay, noise overlay, vignette
  - Scroll-driven sections (`Section`, `RevealText`)
  - Fixed header that adapts text color based on section background
- Data dependencies:
  - Restaurant onboarding POST: `src/app/api/onboard/route.ts`

## `/browse` — Discovery

- File: `src/app/browse/page.tsx`
- UX goals:
  - Fast “near me” results
  - Fallback when location permissions fail
  - Quick search and filter by restaurant name
- Key UI patterns:
  - Premium hero card at top
  - Location modal with Google Places autocomplete
  - Toast feedback (`react-hot-toast`)
- Data dependencies:
  - Nearby restaurants API: `src/app/api/restaurants/nearby/route.ts`
  - Google Maps APIs (JS + Geocoding) via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## `/restaurant/[id]` — Restaurant page + add-to-cart

- File: `src/app/restaurant/[id]/page.tsx`
- UX goals:
  - Clear bag inventory by size/value
  - Fast add-to-cart controls on mobile (big touch targets)
  - Prevent cross-restaurant cart confusion
- Key UI patterns:
  - “ADD” button morphs into +/− quantity control
  - Dietary badges (veg/non-veg/mixed)
  - Clear-cart confirmation modal if switching restaurants
- Data dependencies:
  - Restaurant + bags API: `src/app/api/restaurant/[id]/route.ts`
  - Cart state: `src/contexts/CartContext.tsx`

## `/bag/[id]` — Bag detail

- File: `src/app/bag/[id]/page.tsx`
- UX goals:
  - Explain value proposition (discount, pickup window, limited stock)
  - Provide direct path to reserve/checkout
- Key UI patterns:
  - Discount highlight + strikethrough original price
  - Pickup window + availability rows
  - “Your Impact” card (food saved / CO₂ reduced)
- Data dependencies:
  - Supabase reads: `rescue_bags`, `restaurants`
  - Location distance calculation: `src/lib/location/geolocation.ts`

## `/cart` — Checkout (primary)

- File: `src/app/cart/page.tsx`
- UX goals:
  - Reduce checkout friction (summary → choose payment → pay)
  - Provide clear failure messaging if payments fail
- Key UI patterns:
  - Sticky bottom area for totals/actions
  - Pay at pickup vs online selection
  - Razorpay SDK loaded dynamically
- Data dependencies:
  - Order create (online): `src/app/api/orders/create/route.ts`
  - Payment verification: `src/app/api/orders/verify/route.ts`
  - Pay at pickup: `src/app/api/orders/pickup/route.ts`
  - Cancel order (failed verify): `src/app/api/orders/cancel/route.ts`
  - Env vars: `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

## `/checkout/[id]` — Single-bag checkout (secondary / simplified)

- File: `src/app/checkout/[id]/page.tsx`
- Current behavior:
  - Fetches bag + restaurant via `/api/bag/[id]`
  - Contains a simplified “simulate order” flow (alert + redirect)
- Recommendation:
  - Treat `/cart` as the source of truth for real checkout, and align `/checkout/[id]` to the same order creation routes if this page remains in the product.

## `/orders` — Order history

- File: `src/app/orders/page.tsx`
- UX goals:
  - Quick scan of past orders + status
  - Tap-through to order detail
- Key UI patterns:
  - Animated list cards
  - Empty-state CTA back to browse
- Data dependencies:
  - Supabase select with joins: `orders` + `rescue_bags` + `restaurants`

## `/orders/[id]` — Order detail + pickup countdown

- File: `src/app/orders/[id]/page.tsx`
- UX goals:
  - Make pickup time and location impossible to miss
  - Provide countdown urgency (when pending/confirmed)
  - Surface restaurant contact details
- Key UI patterns:
  - Gradient countdown timer module
  - Detail cards with subtle borders and uppercase microcopy
- Data dependencies:
  - Supabase read: `orders` joined with `rescue_bags` + `restaurants`

## `/order-success` — Confirmation + OTP

- File: `src/app/order-success/page.tsx`
- UX goals:
  - High-confidence confirmation (success animation)
  - OTP prominence with copy-to-clipboard
- Data dependencies:
  - Supabase read by `orderId` query param

## `/help` — Support entry

- File: `src/app/help/page.tsx`
- UX goals:
  - Route customers to the right conversation (order + issue type)
  - Make “general support” always available
- Key UI patterns:
  - Expandable issue type accordion under each order
  - Response-time microcopy
- Data dependencies:
  - Supabase select: last 10 orders for the customer

## `/help/chat` — Support chat

- File: `src/app/help/chat/page.tsx`
- UX goals:
  - Lightweight chat UI with delivery reliability
  - Keep context visible (order + issue)
- Data dependencies:
  - Supabase tables: `support_conversations`, `support_messages`
  - Realtime subscription + polling fallback

## `/profile` — Account profile

- File: `src/app/profile/page.tsx`
- UX goals:
  - Simple edit flow with minimal fields
  - Prevent changing phone number (identity anchor)
- Data dependencies:
  - Supabase update: `customers`

## `/signup` — Email/password signup

- File: `src/app/signup/page.tsx`
- UX goals:
  - Quick account creation with minimal friction
  - Create customer profile server-side to avoid RLS issues
- Data dependencies:
  - Supabase auth signup
  - Profile creation API: `src/app/api/customers/create/route.ts`

## `/verify-otp` — Phone OTP verification

- File: `src/app/verify-otp/page.tsx`
- UX goals:
  - Fast 6-digit OTP entry with auto-advance
  - Clear resend timer
- Data dependencies:
  - Supabase auth: `verifyOtp` / `signInWithOtp`

## `/verify` — Email verification (restaurant onboarding)

- File: `src/app/verify/page.tsx`
- Data dependencies:
  - Verification API: `src/app/api/verify/route.ts`

## Dashboard + internal pages

- `/dashboard` (`src/app/dashboard/page.tsx`) and `/customer/dashboard` (`src/app/customer/dashboard/page.tsx`) are two dashboard variants.
- `/admin` (`src/app/admin/page.tsx`) is an internal table view for onboarding responses.
- `/test-auth` (`src/app/test-auth/page.tsx`) is a diagnostics page for Supabase env/session/db access.

