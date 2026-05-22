import type { CmsProduct, ProductAvailability, ProductStatus } from "@repo/cms/types";

const AVAIL: ProductAvailability[] = ["InStock", "OutOfStock", "PreOrder"];

export function sanitizeProductSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseKeywords(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export function parseAvailability(v: unknown): ProductAvailability {
  const s = String(v ?? "InStock");
  return AVAIL.includes(s as ProductAvailability) ? (s as ProductAvailability) : "InStock";
}

export function parseProductStatus(v: unknown): ProductStatus {
  return v === "publish" ? "publish" : "draft";
}

export function mergeProductPayload(body: Partial<CmsProduct>, existing?: CmsProduct): CmsProduct {
  const name = String(body.name ?? existing?.name ?? "").trim();
  let slug = body.slug !== undefined ? sanitizeProductSlug(String(body.slug)) : existing?.slug ?? "";
  if (!slug && name) slug = sanitizeProductSlug(name);
  const summary = String(body.summary ?? existing?.summary ?? "").trim() || name;
  const metaTitle = String(body.metaTitle ?? existing?.metaTitle ?? "").trim() || `${name} | مدالینو`;
  const metaDescription =
    String(body.metaDescription ?? existing?.metaDescription ?? "").trim() || summary;
  const gtinRaw = body.gtin !== undefined ? String(body.gtin).replace(/\D/g, "") : existing?.gtin;
  const gtin = gtinRaw && gtinRaw.length >= 8 ? gtinRaw : undefined;

  const out: CmsProduct = {
    id: existing?.id ?? "",
    slug,
    status: body.status !== undefined ? parseProductStatus(body.status) : existing?.status ?? "draft",
    featured: body.featured !== undefined ? Boolean(body.featured) : existing?.featured ?? false,
    name,
    summary,
    bodyHtml:
      body.bodyHtml !== undefined
        ? String(body.bodyHtml).trim() || undefined
        : existing?.bodyHtml,
    priceToman: Math.max(0, Math.round(Number(body.priceToman ?? existing?.priceToman ?? 0))),
    badge:
      body.badge !== undefined
        ? String(body.badge).trim() || undefined
        : existing?.badge,
    image: String(body.image ?? existing?.image ?? "").trim() || "/images/products/omega-3-premium.jpg",
    imageAlt: String(body.imageAlt ?? existing?.imageAlt ?? "").trim() || name,
    rating: Math.min(5, Math.max(0, Number(body.rating ?? existing?.rating ?? 0) || 0)),
    reviewCount: Math.max(0, Math.round(Number(body.reviewCount ?? existing?.reviewCount ?? 0))),
    metaTitle,
    metaDescription,
    ogTitle:
      body.ogTitle !== undefined
        ? String(body.ogTitle).trim() || undefined
        : existing?.ogTitle,
    ogDescription:
      body.ogDescription !== undefined
        ? String(body.ogDescription).trim() || undefined
        : existing?.ogDescription,
    keywords: body.keywords !== undefined ? parseKeywords(body.keywords) : existing?.keywords ?? [],
    schemaCategory:
      String(body.schemaCategory ?? existing?.schemaCategory ?? "").trim() || "سلامت و زیبایی",
    brandName: String(body.brandName ?? existing?.brandName ?? "").trim() || "مدالینو",
    gtin,
    mpn: String(body.mpn ?? existing?.mpn ?? "").trim() || slug,
    priceValidUntil:
      String(body.priceValidUntil ?? existing?.priceValidUntil ?? "").trim() || "2027-12-31",
    availability:
      body.availability !== undefined
        ? parseAvailability(body.availability)
        : existing?.availability ?? "InStock",
    bestRating: Math.min(5, Math.max(1, Math.round(Number(body.bestRating ?? existing?.bestRating ?? 5)))),
    worstRating: Math.min(5, Math.max(1, Math.round(Number(body.worstRating ?? existing?.worstRating ?? 1)))),
    reviewBody:
      String(body.reviewBody ?? existing?.reviewBody ?? "").trim() ||
      "کیفیت بسته‌بندی و ارسال عالی بود. قبل از مصرف دارویی با پزشک مشورت کنید.",
    reviewAuthor: String(body.reviewAuthor ?? existing?.reviewAuthor ?? "").trim() || "خریدار تأییدشده",
    reviewRatingValue: Math.min(
      5,
      Math.max(1, Number(body.reviewRatingValue ?? existing?.reviewRatingValue ?? 5)),
    ),
  };
  return out;
}
