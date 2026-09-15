# ServerFactory

> India's configurator-first marketplace for enterprise servers, GPU workstations, and data-center components.

A full-stack Next.js 14 e-commerce platform with a custom server configurator (pick your own CPU, RAM, storage, OS, add-ons), admin panel, role-based authentication, and a landing-page CMS.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Quick start](#quick-start)
3. [Environment variables](#environment-variables)
4. [Project structure](#project-structure)
5. [Architecture overview](#architecture-overview)
6. [New features](#new-features)
7. [Admin user guide](#admin-user-guide)
8. [SEO](#seo)
9. [Deployment](#deployment)
10. [Known limitations & roadmap](#known-limitations--roadmap)
11. [Landing block payload schemas](#landing-block-payload-schemas)

---

## Tech stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14 (App Router)** | SSR/SSG for SEO, single-deploy monolith, server components |
| Language | **TypeScript** | Type safety across UI, API, DB |
| Styling | **Tailwind CSS** | Fast, consistent, matches brand colour `#71BC0A` |
| Database | **PostgreSQL** | Relational model fits products/orders/configurator cleanly |
| ORM | **Prisma** | Type-safe queries, easy migrations |
| Auth | **NextAuth v5 (Auth.js)** | Credentials + Google OAuth, JWT sessions, role-based |
| Validation | **Zod** | Runtime validation in every API route |
| Icons | **lucide-react** | Tree-shakeable, consistent |
| Deployment | **Vercel + Postgres** | Zero-config Next.js hosting |

Deferred for later (not in MVP): Razorpay/Stripe payments, Redis caching, BullMQ queues, AI chatbot, email/SMS notifications, ticketing system.

---

## Quick start

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL 14+ (locally or hosted — Neon, Supabase, Railway all work)
- npm or pnpm

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in at least `DATABASE_URL` and `AUTH_SECRET`:

```bash
# Generate a random secret
openssl rand -base64 32
```

### 3. Set up the database

```bash
# Push schema to database
npx prisma db push

# Seed with 10 sample products, categories, admin user, landing blocks, sample tiers
npm run db:seed
```

> **Note**: If you're upgrading from a previous version that didn't have the `ProductTier` tables, run `npx prisma db push` (non-destructive) or `npx prisma migrate dev --name add_tiers` (creates a migration) to sync the schema.

The seed creates an admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your env (defaults: `admin@theserverfactory.com` / `admin12345`).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Public site**: `http://localhost:3000`
- **Admin panel**: `http://localhost:3000/admin` (sign in with the admin credentials)

---

## Environment variables

See `.env.example` for the full list. The required ones:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `AUTH_SECRET` | ✅ | NextAuth JWT signing secret (32+ chars) |
| `NEXTAUTH_URL` | ✅ in prod | Full site URL, e.g. `https://serverfactory.com` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Used for sitemap, canonical URLs, OG tags |
| `NEXT_PUBLIC_SITE_NAME` | optional | Defaults to "ServerFactory" |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables "Sign in with Google" |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | optional | Used on seed to create first admin |
| `CLOUDINARY_*` | optional | For future admin image uploads (not wired in MVP) |

---

## Project structure

```
serverfactory/
├── prisma/
│   ├── schema.prisma        # Full data model
│   └── seed.ts              # Seeds 10 products, categories, admin, landing blocks
├── src/
│   ├── app/
│   │   ├── (public pages)/  # layout, page, category, product, cart, checkout, search, about, contact, login
│   │   ├── account/         # User dashboard, order history
│   │   ├── admin/           # Admin layout + dashboard, products, categories, orders, users, landing
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth handlers + register
│   │   │   ├── orders/      # Order creation (server-side price recompute)
│   │   │   ├── contact/     # Contact form submission
│   │   │   └── admin/       # Admin-only CRUD: products, categories, orders, landing
│   │   ├── sitemap.ts       # Dynamic sitemap
│   │   ├── robots.ts        # robots.txt
│   │   ├── layout.tsx       # Root layout + SEO metadata + JSON-LD
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/          # Navbar, Footer
│   │   ├── home/            # CMS blocks (hero, promo, featured, grid, logos, CTA)
│   │   ├── product/         # ProductCard, Configurator
│   │   ├── catalog/         # Filters, SortDropdown
│   │   ├── cart/            # CartProvider, CartIcon, CartView
│   │   ├── auth/            # AuthCard (login + register tabs)
│   │   ├── checkout/        # CheckoutForm
│   │   ├── admin/           # ProductForm, OptionGroupsEditor, CategoriesEditor, LandingEditor, OrderStatusControl
│   │   ├── contact/         # ContactForm
│   │   └── ui/              # StatusBadge
│   ├── lib/
│   │   ├── prisma.ts        # Prisma singleton
│   │   ├── auth.ts          # NextAuth config (Credentials + Google, JWT, role callbacks)
│   │   ├── admin-guard.ts   # `requireAdmin()` helper for API routes
│   │   └── utils.ts         # cn, formatINR, slugify, generateOrderNumber
│   └── middleware.ts        # Protects /admin, /account, /checkout
├── next.config.js
├── tailwind.config.ts       # Brand color `#71BC0A` configured as `brand-500`
├── tsconfig.json
└── package.json
```

---

## Architecture overview

### Data model

See `prisma/schema.prisma`. Key tables:

- **User** — with role (`USER` / `ADMIN`) and optional billing profile (phone, company, GST, address)
- **Category** — hierarchical (self-referencing `parentId`), drives navbar and URL structure
- **Product** — has base price, category, images, SEO overrides
- **OptionGroup** + **OptionValue** — the configurator. A product has groups (CPU, RAM, Storage), each group has values (Xeon Gold 6248, 64 GB DDR4). Each value has a `priceDelta` that's added to the base price when selected.
- **Order** + **OrderItem** + **OrderItemOption** — order snapshots. Critically, each option selection stores the label and priceDelta **at the time of purchase**, so historical orders remain accurate even if the admin changes the product later.
- **LandingBlock** — CMS blocks rendered on the homepage. Type-based (HERO_CAROUSEL, PROMO_BANNER, etc.) with a flexible `Json` payload.

### Configurator pricing flow

1. Customer lands on `/product/[slug]`. Server component fetches product + option groups + values.
2. `Configurator` client component initialises selections to each group's default value.
3. As the customer toggles options, `unitPrice` is recomputed in-memory: `basePrice + Σ priceDeltas`.
4. Adding to cart stores the full snapshot (options, priceDelta per option, unitPrice) in `localStorage` via `CartProvider`.
5. At checkout, the cart items + billing are POSTed to `/api/orders`.
6. **The server ignores the client's prices** and recomputes from the database — this prevents anyone tampering with prices in localStorage. See `src/app/api/orders/route.ts`.

### Auth & middleware

- `src/lib/auth.ts` — NextAuth v5 with Prisma adapter, Credentials provider (bcrypt password compare), optional Google OAuth.
- JWT sessions (not database sessions) so the user's role can be embedded in the token.
- `src/middleware.ts` runs on `/admin/*`, `/account/*`, `/checkout/*` and redirects unauthenticated users to `/login`. Non-admins attempting `/admin` are redirected home.

### Landing page (CMS)

The homepage `src/app/page.tsx` reads `LandingBlock` records in order and renders a component per block type. Admins can add/reorder/toggle blocks in `/admin/landing`. Each block has a JSON payload — the editor exposes this as raw JSON for flexibility.

For a future upgrade path, the JSON editor can be swapped for per-block-type form UIs (e.g., drag-drop slide editor for `HERO_CAROUSEL`).

---

## New features

### Quick-Pick tiers (Basic / Intermediate / Advanced)

Products can optionally have 3 pre-defined tiers that bundle a set of configurator options. The product page shows two tabs:

- **Quick Pick** — customer picks Basic / Intermediate / Advanced, sees the bundled options pre-selected, and can still override individual options if needed (the override breaks the tier's price override and falls back to calculated price).
- **Custom Build** — the full component-by-component configurator (original behaviour).

Tiers are per-product and optional. Products with no tiers defined only show the custom build mode. Admin sets them up at `/admin/products/[id]` under the "Quick-Pick Tiers" section.

Each tier has:
- **Name** (fixed enum: `BASIC`, `INTERMEDIATE`, `ADVANCED`)
- **Display label** (defaults to "Basic" / "Intermediate" / "Advanced" but admin can change to e.g. "Starter", "Pro", "Enterprise")
- **Description** (shown to customer)
- **Preset components** — one option value per group (e.g. Basic = 32GB RAM + 480GB SSD + Ubuntu)
- **Price override** — optional. If set, overrides the calculated price *only when customer has not modified the bundle*. If omitted, price is calculated as `basePrice + sum of priceDeltas of selected options`.
- **Active** flag

Orders store the tier name and label as a snapshot on `OrderItem` so admins can see which tier a customer picked.

### Dark mode

Manual light/dark toggle (sun/moon icon in navbar and admin sidebar). Light is the default. Preference persists in localStorage (`serverfactory.theme`). An inline script in `<head>` applies the theme before hydration to prevent flash.

To add dark styles to custom components, use Tailwind's `dark:` variant — e.g. `bg-white dark:bg-gray-900`. CSS variables in `globals.css` drive the base colors.

### Loading states

Skeleton-based loading UI for data-heavy pages (catalog, product detail, admin lists) using Next.js's built-in `loading.tsx` convention. Fallback `FullPageSpinner` for everything else.

Components exported from `src/components/ui/Loading.tsx`:
- `Spinner` — inline spinning circle
- `FullPageSpinner` — centred with label
- `Skeleton` — shimmer block
- `ProductCardSkeleton`, `ProductGridSkeleton`, `TableSkeleton`, `ConfiguratorSkeleton`, `DashboardStatsSkeleton`

### Responsive design

Mobile-first. Key breakpoints:
- **Mobile** (<768px) — hamburger navbar, stacked layouts, card-style tables, full-width buttons
- **Tablet** (768–1024px) — two-column grids where appropriate
- **Desktop** (>1024px) — full navbar, sidebar admin, multi-column layouts

Admin panel: fixed sidebar on desktop, off-canvas drawer on mobile. All admin tables have a card-layout alternative that kicks in below `md:`.

### Hierarchical categories & mega menu

Categories support unlimited nesting depth via a self-referencing `parentId` on the `Category` model. The admin UI supports creating Category → Sub-category → Sub-sub-category (and deeper if needed).

**Admin experience** (`/admin/categories`):
- Tree view with expand/collapse chevrons
- Click **+** next to any category to add a child (nested one level deeper)
- Inline-edit names and slugs, toggle visibility (eye icon), delete
- Sub-categories cannot be deleted if they have products *or* child categories — you must reassign/delete those first
- A warning appears when nesting beyond 3 levels, since the mega menu only surfaces the first 3

**Customer experience (desktop)**: A mega menu. Hovering a top-level category opens a wide panel showing sub-categories as bold column headers with sub-sub-categories listed underneath. A "Featured" column on the right shows 3 featured products from anywhere in that subtree.

**Customer experience (mobile)**: The hamburger drawer shows a recursive accordion — tap a category to expand its children; unlimited nesting supported.

**Category landing pages** (`/category/[slug]`):
- Breadcrumb trail showing the full path
- Sub-category tiles at the top (shown only if the category has children)
- Product grid below showing products from this category **and all descendants**
- Filters (brand, price) operate on the full subtree

**Assigning products**: The admin product form's category dropdown shows full paths (e.g. `Servers → Rack Servers → 1U Rack Servers`) so there's no ambiguity when sub-categories share names.

### Sign-in UX

- Navbar shows a user dropdown (Profile / Orders / Sign out) when logged in; user pill shows first name. Admins also see "Admin Dashboard" in the dropdown.
- After credentials login, admins are routed to `/admin`, regular users to `/account`, honouring any `callbackUrl` query param from middleware.
- After Google OAuth, users pass through `/auth/redirect` which server-side routes them to `/admin` or `/account` based on role.
- Dedicated "Sign out" button always visible in the admin sidebar and in the account page header.


- Navbar shows a user dropdown (Profile / Orders / Sign out) when logged in; user pill shows first name. Admins also see "Admin Dashboard" in the dropdown.
- After credentials login, admins are routed to `/admin`, regular users to `/account`, honouring any `callbackUrl` query param from middleware.
- After Google OAuth, users pass through `/auth/redirect` which server-side routes them to `/admin` or `/account` based on role.
- Dedicated "Sign out" button always visible in the admin sidebar and in the account page header.

---


### Logging in

1. Go to `/login`.
2. Enter admin credentials (default `admin@theserverfactory.com` / the password from your env).
3. After login you'll be redirected to `/account`. Click the account icon in the navbar to reach `/admin`.

### Dashboard

`/admin` — revenue total, order count, product count, customer count, recent orders, top-selling products.

### Managing products

**List**: `/admin/products` — filter, edit, mark inactive. Note: "delete" is a **soft delete** (sets `isActive=false`) because products may be referenced by historical orders.

**Create**: `/admin/products/new`
- Fill basic info (name auto-generates a slug)
- Assign to a category
- Upload an image URL (MVP uses URL strings; Cloudinary integration is scaffolded but not wired)
- Mark as featured to show on homepage
- Fill SEO meta title/description for better search ranking

**Edit configurator** (on the edit page, below the basic form):
- Add option groups like "CPU", "RAM", "Storage"
- For each group, add values with a label and a `priceDelta` (what's added to base price)
- Mark one value in each group as the default

**Important**: if a product has existing orders, be cautious editing its options. The system protects referenced option values from deletion but admin should prefer creating new groups for price updates rather than modifying existing ones.

**Managing Quick-Pick tiers** (optional, below the options editor):
- Click "Add Basic" / "Add Intermediate" / "Add Advanced" to create a tier
- Pick one option value per group — those are the tier's pre-selections
- Optional: set a price override (if blank, the calculated price is used)
- Optional: add a description customers see on the product page
- Toggle "Active" to show/hide without deleting
- If no tiers exist, the product page shows only the custom configurator (tiers are opt-in per product)

### Managing categories

`/admin/categories` — inline-edit names and slugs, toggle visibility, reorder. Create top-level or nested categories. Top-level categories appear in the navbar with their children as hover dropdowns.

You cannot delete a category that still has products — reassign the products first.

### Managing orders

`/admin/orders` — filter by status (Pending → Paid → Processing → Shipped → Delivered, or Cancelled/Refunded).

`/admin/orders/[id]` — see full order details, items with configurator selections, billing address, customer notes. Use the status dropdown in the sidebar to update (customer sees the new status on their `/account/orders/[id]` page).

### Customising the landing page

`/admin/landing` — the homepage is a sequence of blocks:

- **HERO_CAROUSEL** — rotating hero slides with image, heading, subheading, CTA
- **PROMO_BANNER** — thin coloured strip for sale announcements
- **FEATURED_PRODUCTS** — pulls products marked `isFeatured`
- **CATEGORY_GRID** — renders top-level categories as tiles
- **BRAND_LOGOS** — trust row of brand names
- **CTA** — full-width call-to-action section

For each block you can:
- Edit the JSON payload (schemas below)
- Toggle visibility (eye icon)
- Reorder (up/down arrows)
- Delete

Changes take effect within 60 seconds (homepage uses ISR with `revalidate = 60`).

### Managing users

`/admin/users` — read-only list of registered users. To promote someone to admin, run a quick Prisma update in `npx prisma studio`.

---

## SEO

SEO is a first-class concern, per the client brief. Built-in:

- **Dynamic `sitemap.xml`** — includes all active products and visible categories, auto-updates
- **`robots.txt`** — blocks `/admin`, `/account`, `/api`, `/checkout`, `/login`, `/cart`
- **Canonical URLs** on every page via the Metadata API
- **Open Graph + Twitter cards** via the root layout
- **JSON-LD structured data**:
  - `Organization` schema on every page (root layout)
  - `Product` schema on each product detail page (name, image, brand, SKU, price, availability)
- **Per-product meta title/description** — editable in admin
- **Semantic HTML** (`<nav>`, `<main>`, `<article>`, proper heading hierarchy)
- **Server-side rendering** of catalog and product pages for fast crawlability
- **ISR** (Incremental Static Regeneration) on homepage, categories, products — fast page loads

### Getting to top 3 in 3–4 months (honest notes)

The technical SEO foundation is solid — what ranks well depends on **content and backlinks**, which are outside the code:

- Write long-form product descriptions with targeted keywords (Dell PowerEdge buy India, GPU server rental Bangalore, etc.)
- Publish a blog (the stack supports it — add a `/blog` route backed by MDX or a DB `Post` model)
- Build comparison pages ("Dell R740 vs HPE DL380")
- Acquire backlinks from tech review sites, aggregators, and press
- Submit sitemap to Google Search Console and Bing Webmaster Tools
- Monitor Core Web Vitals — the Tailwind + Next.js setup is already fast

Rankings for competitive queries ("buy servers India") typically take 3–6 months of consistent content + backlink effort. 3 months for a brand new domain is aggressive; manage expectations accordingly.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variables (copy from `.env.example`)
4. Add a Postgres database:
   - Vercel Postgres, or
   - Neon / Supabase — just paste the connection string into `DATABASE_URL`
5. Build command: `prisma generate && next build` (already in `package.json` as `build`)
6. Deploy

**Post-deploy**:
```bash
# One-time: push schema to production DB
npx prisma db push

# Seed initial data (optional — or do manually via admin panel)
npm run db:seed
```

### Other platforms

The app is a standard Next.js 14 monolith. It runs on Railway, Render, Fly.io, AWS Amplify, or any Node.js host that supports Next.js SSR.

### Production checklist

- [ ] Set `NEXTAUTH_URL` to the real production URL
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real production URL
- [ ] Regenerate `AUTH_SECRET` for production (don't reuse dev)
- [ ] Change default admin password after first login
- [ ] Configure a custom domain with HTTPS (Vercel does this automatically)
- [ ] Set up Google Analytics / Plausible (add the tracking script to `layout.tsx`)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Configure an email service when ready (Resend is simplest) and wire the contact form + order confirmations

---

## Known limitations & roadmap

These are intentionally deferred from the MVP per the brief:

| Feature | Status | Notes |
|---------|--------|-------|
| Payment gateway | ⏸ Deferred | Orders are marked `PENDING`. Admin confirms payment offline. Razorpay integration is a ~200 LOC add — create `/api/payments/create-order` that calls Razorpay orders API, redirect to their checkout, verify signature on webhook, update order status to `PAID`. |
| Email notifications | ⏸ Deferred | Contact form, order confirmations, password reset all `console.log` for now. Wire Resend/SendGrid. |
| AI chatbot | ⏸ Deferred | Add an Intercom/Tidio widget, or build a custom chat component calling Claude / OpenAI. |
| 2FA + email verification | ⏸ Deferred | Auth.js supports both; requires email infra first. |
| Image uploads | ⏸ Partial | Admin form takes image URLs. For Cloudinary: use `next-cloudinary`'s `<CldUploadButton>` in `ProductForm`. |
| Live chat / WhatsApp | ⏸ Deferred | Embed a third-party script. |
| Ticketing system | ⏸ Deferred | Add `Ticket` + `TicketMessage` Prisma models. |
| Analytics dashboard | 🟡 Basic | MVP admin dashboard has revenue/orders/products/users. Charts (recharts) are a good next add. |
| Rentals | 🟡 Partial | Category exists in nav, but no rental-specific UI (duration selector, monthly pricing). Currently treats rentals as a category of products. |
| Multi-currency | ⏸ Deferred | INR hardcoded. |
| Option changes vs order history | 🟡 Known | Option values referenced by existing orders cannot be hard-deleted (schema uses `RESTRICT`). The options editor handles this gracefully — unreferenced values get cleaned up, referenced ones stay. If admin wants to rename a referenced value, they currently create a new one. Improvement: add a `previousLabel` field or soft-delete flag. |
| Order cancellation by user | ⏸ Deferred | Currently admin-only. |
| Blog / content pages | ⏸ Deferred | Add `/blog` with MDX files or a `Post` model. Critical for SEO. |

---

## Landing block payload schemas

Each `LandingBlock` has a `data` JSON field. Use these shapes in the admin editor:

### HERO_CAROUSEL
```json
{
  "slides": [
    {
      "imageUrl": "https://images.unsplash.com/photo-... ",
      "heading": "Find Your Perfect Server",
      "subheading": "Search 60+ configurations",
      "ctaText": "Shop Servers",
      "ctaLink": "/category/servers"
    }
  ]
}
```

### PROMO_BANNER
```json
{
  "text": "🎉 FY-end Sale — Save up to ₹1,50,000",
  "link": "/category/servers",
  "bgColor": "#71BC0A"
}
```

### FEATURED_PRODUCTS
```json
{ "heading": "Featured Hardware", "limit": 8 }
```
Pulls products where `isFeatured = true`.

### CATEGORY_GRID
```json
{ "heading": "Shop by Category" }
```
Pulls all top-level visible categories.

### BRAND_LOGOS
```json
{ "heading": "Trusted by", "brands": ["Dell", "HP", "Lenovo", "NVIDIA"] }
```

### CTA
```json
{
  "heading": "Not sure what you need?",
  "subheading": "Our engineers will spec the perfect server",
  "ctaText": "Talk to an engineer",
  "ctaLink": "/contact"
}
```

### TESTIMONIALS / RICH_TEXT
Scaffolded types; add a renderer in `src/app/page.tsx` when you're ready to use them.

---

## Scripts

```bash
npm run dev          # Dev server with hot reload
npm run build        # Production build (runs prisma generate first)
npm run start        # Start production server
npm run lint         # ESLint
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Create a migration (production)
npm run db:seed      # Populate sample data
npm run db:studio    # Visual DB explorer at localhost:5555
```

---

## Support

Built for ServerFactory. Questions about the code or architecture — open an issue or reach the dev team.

Made in India 🇮🇳
