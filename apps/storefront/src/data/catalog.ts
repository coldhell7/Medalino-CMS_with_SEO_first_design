import productsRaw from "@repo/cms/content/products.json";
import type { CmsProduct } from "@repo/cms/types";

export type CatalogProduct = CmsProduct;

function loadAllProducts(): CmsProduct[] {
  const raw = productsRaw as unknown;
  if (!Array.isArray(raw)) return [];
  return raw as CmsProduct[];
}

export function getPublishedProducts(): CmsProduct[] {
  return loadAllProducts().filter((p) => p.status === "publish");
}

export function getFeaturedProducts(): CmsProduct[] {
  return getPublishedProducts().filter((p) => p.featured === true);
}

/** Published catalog items (same source as CMS). */
export const SAMPLE_PRODUCTS: CmsProduct[] = getPublishedProducts();

export function formatToman(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

export function getProductBySlug(slug: string): CmsProduct | undefined {
  return getPublishedProducts().find((p) => p.slug === slug);
}

export function absoluteUrl(site: URL | string | undefined, path: string): string {
  if (!path.startsWith("/")) return path;
  if (!site) return path;
  return new URL(path, String(site)).href;
}
