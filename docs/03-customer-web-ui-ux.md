# 03 — Customer web UI/UX

This page documents the design system, UI patterns, and UX decisions used in the customer website (the root Next.js app in `src/`).

## Design intent

The customer website blends:

- **Cinematic brand storytelling** on the landing page (manifesto-style sections, premium motion, and rich imagery).
- **Task-focused commerce UX** for browsing, cart/checkout, orders, and support.

The overall vibe is “premium, calm, high-trust”, with modern motion and generous whitespace.

## Design system (tokens + typography)

### Typography

Defined in `src/app/globals.css`:

- **Serif**: `Cormorant Garamond` (brand headings, manifesto copy, hero typography)
- **Sans**: `Plus Jakarta Sans` (body, UI labels, inputs, dashboards)

Usage conventions in the codebase:

- Headlines often use `font-serif` (and sometimes `italic` for the Latebites wordmark).
- Body and UI elements default to `font-sans`.
- Uppercase microcopy uses tracking to create a “luxury” feel (e.g. `tracking-[0.3em]`).

### Color tokens

Defined as CSS variables in `src/app/globals.css`:

- `--background`: `#F7F4EB` (warm off-white)
- `--foreground`: `#0B1E0F` (premium dark green)
- `--secondary`: `#001220` (midnight navy)
- `--muted`: `#EBE8DE`
- `--border` / `--input`: `#D1CEC2`

These map into Tailwind via the `@theme inline` block, allowing utilities like `bg-background`, `text-foreground`, `border-border`, etc.

### Shapes

- Base radius token in `src/app/globals.css` is `--radius: 0rem` (shadcn variables are wired).
- In practice, many pages use utility-driven rounding for “premium cards”:
  - `rounded-sm` for minimal surfaces
  - `rounded-2xl` / `rounded-3xl` for prominent cards (browse hero, cart bar, modals)

### Iconography

- Primary icon set: `lucide-react`
- Additional icon sets exist (e.g. `@heroicons/react`, `@tabler/icons-react`) but Lucide is used most consistently.

### Component libraries

- **Radix UI primitives** power many interactive components (dialogs, dropdowns, tabs, etc.).
- **shadcn/ui** conventions are present:
  - Config: `components.json` (`style: "new-york"`, CSS variables enabled)
  - Components: `src/components/ui/`

## Layout patterns

### Fixed header + section-based landing page

`src/components/Header.tsx` is fixed at the top and animates based on scroll:

- It switches text color depending on which section is near the top of the viewport.
- Sections are identified by `id` values (e.g. `hero`, `problem`, `impact`) and a “dark sections” allowlist determines white vs dark text.

The landing page is built from “cinematic sections”:

- `src/components/cinematic/Section.tsx` provides consistent section spacing and minimum height.
- `src/components/cinematic/RevealText.tsx` handles staggered text reveals.

### Content containers

Common patterns:

- Centered content with max widths (`max-w-3xl`, `max-w-4xl`, `max-w-7xl`)
- Large top padding on app pages (`pt-24 md:pt-32`) to avoid overlapping the fixed header

### Persistent cart CTA

`src/components/CartBar.tsx` is a fixed bottom bar that:

- Appears when the cart has items
- Slides in/out with `AnimatePresence`
- Adds iOS safe-area padding via `env(safe-area-inset-bottom)`
- Is hidden on “auth + checkout” routes and the landing page

This is a critical mobile UX affordance because it gives customers a constant “Checkout” action without requiring scrolling back up.

## Motion design

### Tooling

- `framer-motion` is used for core page/element transitions
- Additional “premium” CSS animations live in:
  - `src/app/premium-animations.css`
  - `src/app/3d-effects.css`

### Motion principles used

- **Reveal from blur/translate**: text and images frequently animate upward with opacity/blur changes.
- **Cinematic background motion**: hero uses a Ken Burns–style slow zoom + blur-to-sharp transition.
- **Premium easing**: CSS defines luxury curves (`--ease-premium`, `--ease-out-expo`) to avoid “snappy” motion.
- **Micro-interactions**:
  - hover lift, glow, shimmer, and gradient movement
  - scroll indicator bounce

### Examples (where to look)

- Landing hero Ken Burns + overlay layering: `src/app/page.tsx`
- Premium CSS animation library: `src/app/premium-animations.css`
- 3D/perspective helpers: `src/app/3d-effects.css`
- Browse hero + card motion: `src/app/browse/page.tsx`
- Cart bar slide-in/out: `src/components/CartBar.tsx`

## Core UX patterns (commerce)

### Authentication

Primary patterns:

- `AuthProvider` in `src/contexts/AuthContext.tsx` loads session + derives role (customer vs restaurant) by checking profile tables.
- `AuthModal` in `src/components/AuthModal.tsx` provides an email-first flow:
  - user enters email → app decides login vs signup
  - supports email/password + Google OAuth

Notable UX behavior:

- `/browse` redirects unauthenticated users to `/?auth=customer` (auto-opens auth modal via query param handling in `src/app/page.tsx`).

### Location-first browse UX

`/browse` prioritizes:

- automatic location detection (with timeout + fallback)
- manual location search via Google Places autocomplete
- restaurant + bag listing filtered by date, active status, and quantity

### “Single restaurant per cart”

`CartContext` enforces a business rule: cart items must belong to one restaurant at a time.

UX handling on `/restaurant/[id]`:

- If a user tries to add from a different restaurant, a confirmation modal prompts to clear the cart first.

### Checkout UX

The main checkout lives at `/cart`:

- Clear breakdown of totals (platform fee is a constant `₹5` in `CartContext`)
- Payment options:
  - pay at pickup (server route creates order(s) directly)
  - online payment (Razorpay flow)
- Error states use toast messaging (`react-hot-toast`) and inline banners

## Support UX (chat)

Support is designed as an “order-linked chat”:

- Entry point: `/help` → choose an order + issue type
- Chat: `/help/chat` uses:
  - a sticky header summarizing the order + issue
  - message bubbles with sender differentiation
  - read-status hints (where available)
  - Supabase Realtime subscription **plus** polling fallback for reliability

Admin support UX is documented in [05 — Admin portals](./05-admin-portals.md).

## Mobile responsiveness strategy

The website includes global mobile rules in `src/app/globals.css`:

- Uses `100svh` overrides for `.h-screen` and `.min-h-screen` to handle iOS Safari “dynamic toolbar” issues.
- Adds safe-area padding at the bottom (`env(safe-area-inset-bottom)`).
- Forces grid layouts to stack (`.grid { grid-template-columns: 1fr !important; }`) under `640px`.
- Downscales very large Tailwind typography classes (`text-8xl` → `3rem`, etc.) to prevent overflow.
- Adds a solid header background on mobile to avoid overlapping the underlying hero imagery.

Additional page-level mobile tweaks exist where needed (e.g. OTP letter spacing, countdown digits, chat input safe-area padding).

## Accessibility notes (current + recommended)

Current positives:

- Many interactive elements use visible hover/focus styling via Tailwind utilities.
- Some buttons include `aria-label` (e.g. header user menu).

Recommended improvements (future):

- Add a “reduced motion” mode using `prefers-reduced-motion`.
- Ensure all icon-only buttons have `aria-label`.
- Audit color contrast in gradient sections and text-over-image areas.
