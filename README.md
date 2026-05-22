# Medalino — Fastest CMS

Fastest CMS with all of the WordPress features + SEO friendly

Medalino is a lightweight, fast CMS designed to provide the features site owners expect from WordPress while remaining SEO-first and performance-focused.

Quick highlights
- Fast server-side rendering and small client bundle sizes
- Built-in admin panel and content CMS
- SEO-friendly markup and JSON-LD support
- Easy deploy with Nginx + Let's Encrypt

Quickstart (development)

```bash
# install dependencies
pnpm install

# run storefront and admin (monorepo)
pnpm --filter storefront dev
pnpm --filter admin dev
```

Production (server)

1. Build the monorepo: `pnpm --filter admin build`
2. Run the admin on port `3002` and proxy via Nginx at `https://admin.medalino.ir`

Environment variables
- `ADMIN_AUTH_SECRET` — long secret used to sign session tokens
- `PUBLIC_ADMIN_URL` — e.g. `https://admin.medalino.ir`
- `PUBLIC_SITE_URL` — e.g. `https://medalino.ir`

License

MIT
