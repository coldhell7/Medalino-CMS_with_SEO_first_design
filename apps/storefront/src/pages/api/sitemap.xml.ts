import type { APIRoute } from "astro";
import { getPublishedProducts } from "../../data/catalog";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? String(site).replace(/\/$/, "") : "https://medalino.ir";
  const publishedProducts = getPublishedProducts();

  function nowIso(): string {
    return new Date().toISOString();
  }

  const urls = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/blog", changefreq: "weekly", priority: "0.7" },
    ...publishedProducts.map((p) => ({
      path: `/products/${p.slug}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const xmlUrls = urls
    .map(
      (u) => `  <url>
    <loc>${siteUrl}${u.path}</loc>
    <lastmod>${nowIso()}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
