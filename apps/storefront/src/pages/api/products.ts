import type { APIRoute } from "astro";
import { getPublishedProducts, getProductBySlug } from "../../data/catalog";

export const prerender = false;

export const GET: APIRoute = async ({ request, site }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const featured = url.searchParams.get("featured");

  if (slug) {
    const product = getProductBySlug(slug);
    if (!product) {
      return new Response(JSON.stringify({ ok: false, message: "not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, product }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let products = getPublishedProducts();

  if (featured === "true") {
    products = products.filter((p) => p.featured === true);
  }

  return new Response(JSON.stringify({ ok: true, products, count: products.length }), {
    headers: { "Content-Type": "application/json" },
  });
};
