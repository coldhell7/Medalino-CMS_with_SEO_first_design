# Medalino — Fastest AI-Powered CMS

Medalino is a modern, lightweight, and blazing-fast CMS designed to provide all the power of WordPress with a focus on SEO, performance, and AI-assisted content creation.

Built with a modern monorepo architecture, Medalino separates the concerns of content management and delivery, ensuring your storefront remains incredibly fast while providing a rich, responsive admin experience.

## 🚀 Key Features

- **⚡ Blazing Fast Performance:** High-performance storefront powered by Astro and server-side rendering.
- **🤖 AI-Powered Content:** Integrated Google Gemini support for generating SEO-optimized posts, product descriptions, and metadata.
- **🔍 SEO-First Architecture:** Built-in JSON-LD support, SEO-friendly markup, and automatic sitemap generation.
- **🎨 Modern Tech Stack:** Next.js 15+ (Admin), Astro 6+ (Storefront), Tailwind CSS 4, and React 19.
- **📦 Monorepo Structure:** Efficiently managed with Turbo and pnpm for shared logic and components.
- **💾 Robust Data Layer:** Drizzle ORM with Postgres support and Upstash Redis for caching/rate-limiting.
- **🛠️ Easy Deployment:** Pre-configured Nginx and systemd service configurations for seamless production setup.

## 🛠️ Tech Stack

- **Frameworks:** [Astro](https://astro.build/) (Storefront), [Next.js](https://nextjs.org/) (Admin)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/), [Postgres](https://www.postgresql.org/)
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **Caching:** [Upstash Redis](https://upstash.com/)
- **Monorepo:** [Turbo](https://turbo.build/), [pnpm](https://pnpm.io/)

## 📂 Project Structure

```text
.
├── apps/
│   ├── admin/        # Next.js admin dashboard with AI content generation
│   └── storefront/   # Astro-powered high-performance public website
├── packages/
│   ├── cms/          # Content storage and CMS logic (JSON-based)
│   ├── database/     # Drizzle ORM schemas and database client
│   ├── shared/       # Shared Zod schemas and utility functions
│   └── ui/           # Reusable React components and CSS tokens
├── deploy/           # Nginx and systemd configuration files
└── scripts/          # Helper scripts for maintenance and deployment
```

## 🚥 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 22.12.0)
- [pnpm](https://pnpm.io/) (>= 10.x)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/medalino.git
   cd medalino
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Setup environment variables (see [Environment Variables](#-environment-variables)).

### Development

Run the entire project in development mode:
```bash
pnpm dev
```

Or run specific applications:
```bash
pnpm --filter storefront dev
pnpm --filter admin dev
```

### Database Management

```bash
# Generate migrations
pnpm db:generate

# Push changes to database
pnpm db:push
```

## ⚙️ Environment Variables

Create a `.env` file in the root or specifically within `apps/admin` and `apps/storefront`.

| Variable | Description | Location |
|----------|-------------|----------|
| `DATABASE_URL` | Postgres connection string | root/admin |
| `GEMINI_API_KEY` | Google Gemini API Key for AI features | admin |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for caching | admin |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | admin |
| `PUBLIC_ADMIN_URL` | URL of the admin panel | storefront/admin |
| `PUBLIC_SITE_URL` | URL of the public storefront | storefront/admin |
| `ADMIN_AUTH_SECRET` | Secret for session tokens | admin |

## 🚢 Deployment

1. **Build the project:**
   ```bash
   pnpm build
   ```

2. **Server Setup:**
   The `deploy/` directory contains sample Nginx and systemd configurations.
   - Use `medalino-admin.service` for managing the Next.js admin process.
   - Configure Nginx using `nginx-admin.conf` and `nginx-medalino.conf`.

3. **Static Generation:**
   The storefront is built using Astro and can be deployed as static files or using a Node.js adapter depending on your configuration.

## 📄 License

This project is licensed under the MIT License.
