# Medalino

**Fastest Persian CMS — E-commerce platform optimized for SEO, performance, and simplicity.**

Medalino is a lightweight, high-performance CMS designed to provide the full feature set site owners expect from WordPress (admin panel, content management, media, SEO, AI-powered content generation) while being SEO-first and performance-focused. All content is statically generated for maximum speed.

Built as a monorepo with **Next.js 16** (admin panel) and **Astro 6** (storefront), orchestrated by **Turborepo**.

---

## Architecture

```
medalino/
├── apps/
│   ├── admin/          # Next.js 16 admin panel (CMS, AI, SEO, Orders)
│   └── storefront/     # Astro 6 public site (SSG, Persian e-commerce)
├── packages/
│   ├── cms/            # Content types + JSON data files
│   ├── database/       # Drizzle ORM + PostgreSQL schema
│   ├── shared/         # Shared utilities (date, numbers, validators)
│   └── ui/             # Shared React UI components
```

| Layer | Technology |
|-------|-----------|
| **Admin Panel** | Next.js 16.2.6 (Turbopack), React 19, Tailwind CSS 4 |
| **Storefront** | Astro 6.3.2, React 19, Vite |
| **Database** | PostgreSQL + Drizzle ORM 0.45 (optional, with Supabase support) |
| **Build** | Turborepo 2.5.4, pnpm 10.28.2 |
| **Language** | TypeScript 5.9 (strict mode across all packages) |
| **AI Integration** | Google Gemini, OpenRouter, DeepSeek |
| **Caching** | Upstash Redis (rate limiting, AI response cache) |
| **Styling** | Tailwind CSS 4 (admin), custom CSS (storefront) |
| **Deployment** | Ubuntu + Nginx + Let's Encrypt + systemd |

---

## Repository Structure

```
apps/admin/src/
├── app/
│   ├── api/
│   │   ├── ai/              # AI content & product generation
│   │   ├── auth/            # Login/logout (JWT sessions)
│   │   ├── cms/             # CRUD for products, posts, pages, media
│   │   ├── dashboard/       # Dashboard stats aggregation
│   │   ├── seo/             # Analysis, meta generation, sitemap
│   │   └── settings/        # Site settings, AI tokens, usage
│   ├── cms/                 # CMS pages (products, posts, pages, media)
│   ├── settings/            # Settings page with AI tab
│   ├── content/             # AI content generation page
│   ├── dashboard/           # Dashboard with analytics & charts
│   └── layout.tsx           # Shell with sidebar + auth
├── components/
│   ├── dashboard/           # Recharts KPIs & charts
│   ├── RichEditor.tsx       # WYSIWYG HTML editor
│   ├── ImageUploader.tsx    # Media upload widget
│   └── AiMetaButton.tsx     # AI-powered meta fill button
└── lib/
    ├── cms-files.ts         # Read/write CMS JSON files
    ├── cms-product-payload.ts # Product merge + sanitization
    ├── site-settings.ts     # AI tokens, prompts, site config
    ├── ai-usage.ts          # Token usage tracking
    └── order-stages.ts      # Order status helpers

apps/storefront/src/
├── pages/
│   ├── products/[slug].astro  # Product detail page (PDP)
│   ├── blog/[slug].astro      # Blog post page
│   ├── p/[slug].astro         # CMS pages (about, contact)
│   ├── search.astro           # Full-text product search
│   └── cart.astro             # Client-side cart
├── components/               # Reusable Astro components
├── data/catalog.ts           # Product catalog from CMS JSON
├── layouts/                  # Base layout with SEO, JSON-LD
└── lib/                      # Cart (IndexedDB), site settings
```

---

## Prerequisites

- **Node.js** >= 22.12 (tested on v25.5)
- **pnpm** >= 10
- **PostgreSQL** (optional — only for demo orders)

---

## Quick Start (Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start the admin panel (http://localhost:3000)
pnpm --filter admin dev

# 3. Start the storefront (http://localhost:4321)
pnpm --filter storefront dev

# Or run both via Turborepo:
pnpm dev
```

### Default Login

The admin panel is protected by a login page. Set:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=medalino
ADMIN_AUTH_SECRET=your-random-secret-here
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_USERNAME` | Yes | — | Admin login username |
| `ADMIN_PASSWORD` | Yes | — | Admin login password |
| `ADMIN_AUTH_SECRET` | Yes | — | Secret key for JWT session signing |
| `PUBLIC_ADMIN_URL` | Yes | — | Admin panel URL (e.g., `https://admin.medalino.ir`) |
| `PUBLIC_SITE_URL` | Yes | — | Storefront URL (e.g., `https://medalino.ir`) |
| `DATABASE_URL` | No | — | PostgreSQL connection string (for demo orders) |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key (must start with `sk-or-`) |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek API key |
| `DEFAULT_AI_PROVIDER` | No | `deepseek` | Default AI provider (`gemini`, `openrouter`, `deepseek`) |
| `CONTENT_PROMPT` | No | built-in | Custom system prompt for AI content generation |
| `PRODUCT_PROMPT` | No | built-in | Custom system prompt for AI product generation |
| `UPSTASH_REDIS_REST_URL` | No | — | Redis URL (rate limiting + AI cache) |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Redis token |

API keys can also be saved at runtime via the Settings page (stored in `.data/site-settings.json`).

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Full monorepo build (admin + storefront) |
| `pnpm dev` | Run all apps in development mode |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push Drizzle schema to database |
| `pnpm --filter admin build` | Build admin panel only |
| `pnpm --filter storefront build` | Build storefront only |

---

## Build for Production

```bash
# Full build (both apps)
pnpm build

# Or individually:
pnpm --filter admin build       # Output: apps/admin/.next/
pnpm --filter storefront build  # Output: apps/storefront/dist/
```

The storefront is a **static site** (`output: "static"` in Astro). Content from the CMS (`packages/cms/content/*.json`) is read at build time. After updating content via the admin panel, the storefront must be rebuilt and redeployed.

---

## Deployment

### Admin Panel (Next.js)

The admin runs as a **Node.js server** behind Nginx reverse proxy.

1. Set up a Ubuntu/Debian server with Nginx + Node.js + pnpm
2. Clone the repo to `/var/www/medalino`
3. Run the deploy script:
   ```bash
   sudo bash scripts/deploy-admin.sh /var/www/medalino admin.medalino.ir 3002
   ```
4. Configure your environment at `/etc/medalino/admin.env`
5. Build and start:
   ```bash
   cd /var/www/medalino
   pnpm install && pnpm --filter admin build
   systemctl enable --now medalino-admin
   ```

Deployment docs (Persian): `docs/DEPLOY_ADMIN.md`

### Storefront (Static Site)

The storefront outputs static HTML to `apps/storefront/dist/`. Deploy this directory to any static hosting:

```bash
pnpm --filter storefront build
# Deploy apps/storefront/dist/ to your server root
```

The provided Nginx config (`deploy/nginx-medalino.conf`) serves the storefront and proxies API calls to the admin panel.

---

## Key Features

- **Dual-app architecture**: Admin panel (Next.js SSR) + Storefront (Astro SSG)
- **Persian-first**: RTL support, Persian date formatting, Jalali calendar
- **AI-powered content**: Auto-generate product descriptions, meta tags, and blog posts via Gemini / OpenRouter / DeepSeek
- **SEO toolkit**: Meta analysis, keyword suggestions, Open Graph preview, robots.txt, sitemap, JSON-LD structured data
- **WYSIWYG editor**: Rich HTML editing for product and post content
- **Media management**: Upload and organize images
- **Token usage tracking**: Monitor AI API consumption per provider
- **Dashboard**: KPI cards, charts (Recharts), order tracking
- **Redis caching**: AI response cache + rate limiting (20 req/min per endpoint)
- **Cart**: Client-side cart using IndexedDB
- **Full-text search**: Client-side product search
- **Responsive design**: Optimized for mobile and desktop
- **SEO scores**: Lighthouse 95+ on desktop (static pages)

---

## Content Flow

```
Admin Panel                   Storefront
    │                             │
    │  PUT /api/cms/products      │
    │       │                     │
    │       ▼                     │
    │  products.json  ──────►   catalog.ts (build-time import)
    │  posts.json      ──────►   blog/[slug].astro
    │  pages.json      ──────►   p/[slug].astro
    │       │                     │
    │       │                     ▼
    │       │              Static HTML pages
    │       │              (astro build)
    │       │
    │  Edit → Save → Rebuild storefront → Deploy
```

---

## License

MIT
