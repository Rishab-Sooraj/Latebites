# 01 — Project overview

Latebites is a surplus-food rescue product: customers buy discounted “Rescue Bags” (mystery bundles) from nearby restaurants, pick them up during a time window, and use an OTP for pickup verification. The product includes a customer website, admin dashboards, and restaurant/customer Flutter apps.

## What lives in this repo

### Customer website (Next.js)

- Path: `src/`
- Purpose: customer ordering flow + support chat + the “manifesto” landing page (restaurant onboarding form).

### Admin portals (Next.js)

- Paths: `admin-portal/` and `latebites-admin/`
- Purpose: operations dashboards (restaurants/customers/orders), plus a support inbox (currently implemented in `latebites-admin/`).

### Flutter apps

- `mobile_app/`: customer mobile app (native iOS/Android)
- `latebites-restaurant-app/`: restaurant partner app (create bags, manage orders, toggle availability)

### Database (Supabase)

- Migrations: `supabase/migrations/`
- Core tables: customers, restaurants, rescue_bags, orders, favorites, support conversations/messages.

## System diagram (high-level)

```mermaid
graph TD
  CustomerWeb["Customer Web (Next.js)"] -->|Auth, DB, Realtime| Supabase[(Supabase Postgres)]
  CustomerWeb -->|Storage (images/scripts)| SupabaseStorage["Supabase Storage"]
  CustomerWeb -->|Maps/Places/Geocoding| GoogleMaps["Google Maps APIs"]
  CustomerWeb -->|Online payments| Razorpay["Razorpay"]
  CustomerWeb -->|Transactional emails| Resend["Resend"]

  AdminPortal["Admin Portal (Next.js)"] -->|Auth, DB, Realtime| Supabase
  AdminPortal -->|Support inbox| Supabase
  AdminPortal -->|Email (ops)| ZeptoMail["ZeptoMail (admin)"]

  RestaurantApp["Restaurant App (Flutter)"] -->|Auth, DB| Supabase
  CustomerMobile["Customer Mobile (Flutter)"] -->|Auth, DB| Supabase
```

## Core domain concepts

### Restaurants

- Restaurants can be “verified” and “active”.
- Restaurants publish daily Rescue Bags with pickup windows.

### Rescue Bags

- A bag has a size (`small`/`medium`/`large`), discounted price, quantity, and pickup start/end times.
- Bags are filtered by date and quantity availability.

### Orders

- Orders link a customer, restaurant, and rescue bag.
- Orders have a status lifecycle and support both online payments and pay-at-pickup.
- Pickup verification uses an OTP stored on the order.

### Support chat

- Customers start a conversation from the Help page (optionally tied to a specific order).
- Conversations contain messages (customer/admin).
- Realtime is enabled on support tables, with polling fallback in the UIs.

## Key product flows (end-to-end)

### Customer ordering flow (web)

1. Auth: customer signs in/up (email/password or Google OAuth).
2. Browse: location permission → nearby restaurants & bags list.
3. Choose restaurant: view bags for one restaurant, add to cart (cart is single-restaurant).
4. Checkout (`/cart`):
   - Pay at pickup (creates order(s) server-side via service role), or
   - Pay online (Razorpay order → signature verification → confirm order).
5. Success: order confirmation + OTP shown for pickup.
6. Orders: view order history and order details (including pickup window countdown).

### Support flow

1. Customer visits `/help`, selects an order + issue type (or general support).
2. `/help/chat` creates or reuses a `support_conversations` row.
3. Messages are written to `support_messages` and delivered via Supabase Realtime.
4. Admin uses the support inbox in `latebites-admin/` to respond and update status.

### Restaurant onboarding (landing page form)

1. Restaurant submits details on the landing page form.
2. Server route writes to the onboarding table and emails a verification link.
3. Verification route confirms and updates the onboarding record.

## Current-state notes (important for development)

- There are two admin apps (`admin-portal/` and `latebites-admin/`). The latter currently contains the support dashboard and additional admin APIs.
- Customer checkout logic primarily lives in `/cart`. There is also a `/checkout/[id]` route used by `/bag/[id]`, but it currently contains a simplified “simulate order” flow.
- Some tables referenced by the admin/onboarding code (e.g. `admins`, `Resturant Onboarding`) are not defined in the migrations in `supabase/migrations/`. Treat migrations as “customer core schema”, and confirm the ops tables exist in your Supabase project.

