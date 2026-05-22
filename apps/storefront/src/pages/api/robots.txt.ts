import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? String(site).replace(/\/$/, "") : "https://medalino.ir";

  const content = `User-agent: *
Allow: /

Disallow: /api/
Disallow: /_astro/
Disallow: /cdn-cgi/

Sitemap: ${siteUrl}/sitemap.xml`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
