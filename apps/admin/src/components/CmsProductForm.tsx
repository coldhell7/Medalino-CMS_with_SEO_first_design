"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsProduct, ProductAvailability, ProductStatus } from "@repo/cms/types";

type Props = {
  productId?: string;
  initial?: Partial<CmsProduct> | null;
  onCancelHref: string;
};

export function CmsProductForm({ productId, initial, onCancelHref }: Props) {
  const router = useRouter();
  const i = initial ?? {};
  const [status, setStatus] = useState<ProductStatus>(i.status ?? "draft");
  const [featured, setFeatured] = useState(Boolean(i.featured));
  const [slug, setSlug] = useState(i.slug ?? "");
  const [name, setName] = useState(i.name ?? "");
  const [summary, setSummary] = useState(i.summary ?? "");
  const [bodyHtml, setBodyHtml] = useState(i.bodyHtml ?? "");
  const [priceToman, setPriceToman] = useState(String(i.priceToman ?? 0));
  const [badge, setBadge] = useState(i.badge ?? "");
  const [image, setImage] = useState(i.image ?? "");
  const [imageAlt, setImageAlt] = useState(i.imageAlt ?? "");
  const [rating, setRating] = useState(String(i.rating ?? 4.5));
  const [reviewCount, setReviewCount] = useState(String(i.reviewCount ?? 0));
  const [metaTitle, setMetaTitle] = useState(i.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(i.metaDescription ?? "");
  const [ogTitle, setOgTitle] = useState(i.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(i.ogDescription ?? "");
  const [keywords, setKeywords] = useState((i.keywords ?? []).join("، "));
  const [schemaCategory, setSchemaCategory] = useState(i.schemaCategory ?? "");
  const [brandName, setBrandName] = useState(i.brandName ?? "مدالینو");
  const [gtin, setGtin] = useState(i.gtin ?? "");
  const [mpn, setMpn] = useState(i.mpn ?? "");
  const [priceValidUntil, setPriceValidUntil] = useState(i.priceValidUntil ?? "2027-12-31");
  const [availability, setAvailability] = useState<ProductAvailability>(i.availability ?? "InStock");
  const [bestRating, setBestRating] = useState(String(i.bestRating ?? 5));
  const [worstRating, setWorstRating] = useState(String(i.worstRating ?? 1));
  const [reviewBody, setReviewBody] = useState(i.reviewBody ?? "");
  const [reviewAuthor, setReviewAuthor] = useState(i.reviewAuthor ?? "");
  const [reviewRatingValue, setReviewRatingValue] = useState(String(i.reviewRatingValue ?? 5));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const payload = (): Record<string, unknown> => ({
    status,
    featured,
    slug,
    name,
    summary,
    bodyHtml: bodyHtml.trim() || undefined,
    priceToman: Math.max(0, Math.round(Number(priceToman) || 0)),
    badge: badge.trim() || undefined,
    image: image.trim(),
    imageAlt: imageAlt.trim(),
    rating: Number(rating) || 0,
    reviewCount: Math.round(Number(reviewCount) || 0),
    metaTitle: metaTitle.trim(),
    metaDescription: metaDescription.trim(),
    ogTitle: ogTitle.trim() || undefined,
    ogDescription: ogDescription.trim() || undefined,
    keywords: keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
    schemaCategory: schemaCategory.trim(),
    brandName: brandName.trim(),
    gtin: gtin.trim().replace(/\D/g, "") || undefined,
    mpn: mpn.trim(),
    priceValidUntil: priceValidUntil.trim(),
    availability,
    bestRating: Math.round(Number(bestRating) || 5),
    worstRating: Math.round(Number(worstRating) || 1),
    reviewBody: reviewBody.trim(),
    reviewAuthor: reviewAuthor.trim(),
    reviewRatingValue: Number(reviewRatingValue) || 5,
  });

  const runAiOptimize = async () => {
    const title = name.trim();
    if (!title) {
      setMsg("برای تکمیل خودکار ابتدا نام محصول را وارد کنید.");
      return;
    }
    setAiLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ai/product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          keywords: keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean).join("، "),
        }),
      });
      const raw = await res.text();
      const json = raw.trim()
        ? (JSON.parse(raw) as { error?: string; draft?: unknown })
        : { error: `پاسخ خالی (${res.status})` };
      if (!res.ok || json.error) {
        setMsg(json.error ?? "درخواست هوش مصنوعی ناموفق بود.");
        return;
      }
      const d = json.draft as Record<string, unknown> | undefined;
      if (!d || typeof d !== "object" || "raw" in d) {
        setMsg("خروجی مدل قابل اعمال نبود؛ پیش‌نویس را دستی بررسی کنید.");
        return;
      }
      const escapeHtml = (t: string) =>
        t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const toBodyHtml = (text: string) => {
        const parts = text
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (!parts.length) return "";
        return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
      };
      if (typeof d.metaTitle === "string" && d.metaTitle.trim()) setMetaTitle(d.metaTitle.trim());
      if (typeof d.metaDescription === "string" && d.metaDescription.trim())
        setMetaDescription(d.metaDescription.trim());
      if (typeof d.description === "string" && d.description.trim()) {
        const desc = d.description.trim();
        setSummary(desc);
        const html = toBodyHtml(desc);
        if (html) setBodyHtml(html);
      }
      const alts = d.imageAlts;
      if (Array.isArray(alts) && typeof alts[0] === "string" && alts[0].trim()) setImageAlt(alts[0].trim());
      if (typeof d.metaTitle === "string" && d.metaTitle.trim()) setOgTitle(d.metaTitle.trim());
      if (typeof d.metaDescription === "string" && d.metaDescription.trim())
        setOgDescription(d.metaDescription.trim());
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const url = productId ? `/api/cms/products/${productId}` : "/api/cms/products";
      const method = productId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.message ?? "خطا");
        return;
      }
      router.push("/cms/products");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!productId) return;
    if (!confirm("حذف این محصول؟")) return;
    const res = await fetch(`/api/cms/products/${productId}`, { method: "DELETE" });
    if (res.ok) router.push("/cms/products");
    else setMsg("حذف نشد");
  };

  const label = "block text-sm font-medium";

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          خلاصه، متا، متن HTML کوتاه و alt تصویر را از روی نام و کلمات کلیدی با Gemini تکمیل یا بهینه می‌کند.
        </p>
        <button
          type="button"
          disabled={aiLoading || saving || !name.trim()}
          onClick={() => void runAiOptimize()}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {aiLoading ? "در حال تولید…" : "تکمیل / بهینه‌سازی با هوش مصنوعی"}
        </button>
      </div>
      {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
      <Surface title="عمومی و قیمت">
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            وضعیت
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="draft">پیش‌نویس</option>
              <option value="publish">منتشر</option>
            </select>
          </label>
          <label className={`${label} flex items-center gap-2 pt-6`}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4"
            />
            <span>محصول ویژه (نمایش در بخش ویژه فروشگاه)</span>
          </label>
          <label className={label}>
            نامک (URL)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            نام محصول
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            خلاصه (نمایش و schema:description)
            <textarea
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label className={label}>
            قیمت (تومان)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={priceToman}
              onChange={(e) => setPriceToman(e.target.value)}
            />
          </label>
          <label className={label}>
            برچسب (اختیاری)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </label>
          <label className={label}>
            تصویر (مسیر)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </label>
          <label className={label}>
            متن جایگزین تصویر
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
          </label>
          <label className={label}>
            امتیاز (۰–۵)
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </label>
          <label className={label}>
            تعداد نظرات
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={reviewCount}
              onChange={(e) => setReviewCount(e.target.value)}
            />
          </label>
        </div>
      </Surface>

      <Surface title="محتوای تکمیلی صفحه محصول">
        <label className={label}>
          HTML اختیاری (زیر خلاصه)
          <textarea
            className="mt-1 w-full rounded-md border p-2 font-mono text-xs"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            rows={6}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
          />
        </label>
      </Surface>

      <Surface title="سئو (meta و Open Graph)">
        <div className="grid gap-3 md:grid-cols-2">
          <label className={`${label} md:col-span-2`}>
            عنوان متا (title)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            توضیح متا (description)
            <textarea
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </label>
          <label className={label}>
            og:title (اختیاری)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
            />
          </label>
          <label className={label}>
            og:description (اختیاری)
            <textarea
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={2}
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            کلمات کلیدی (با ویرگول یا ،)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </label>
        </div>
      </Surface>

      <Surface title="اسکیما و داده ساخت‌یافته">
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            دسته schema (category)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={schemaCategory}
              onChange={(e) => setSchemaCategory(e.target.value)}
            />
          </label>
          <label className={label}>
            نام برند (brand)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </label>
          <label className={label}>
            GTIN (۸ یا ۱۳ رقم، اختیاری)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={gtin}
              onChange={(e) => setGtin(e.target.value)}
              dir="ltr"
            />
          </label>
          <label className={label}>
            MPN
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={mpn}
              onChange={(e) => setMpn(e.target.value)}
            />
          </label>
          <label className={label}>
            اعتبار قیمت تا (ISO date)
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={priceValidUntil}
              onChange={(e) => setPriceValidUntil(e.target.value)}
              dir="ltr"
            />
          </label>
          <label className={label}>
            موجودی (Offer.availability)
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={availability}
              onChange={(e) => setAvailability(e.target.value as ProductAvailability)}
            >
              <option value="InStock">InStock</option>
              <option value="OutOfStock">OutOfStock</option>
              <option value="PreOrder">PreOrder</option>
            </select>
          </label>
          <label className={label}>
            بهترین امتیاز aggregate
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={bestRating}
              onChange={(e) => setBestRating(e.target.value)}
            />
          </label>
          <label className={label}>
            بدترین امتیاز aggregate
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={worstRating}
              onChange={(e) => setWorstRating(e.target.value)}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            متن نمونه Review (JSON-LD)
            <textarea
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={2}
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
            />
          </label>
          <label className={label}>
            نویسندهٔ نظر
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={reviewAuthor}
              onChange={(e) => setReviewAuthor(e.target.value)}
            />
          </label>
          <label className={label}>
            امتیاز نظر (۱–۵)
            <input
              type="number"
              min={1}
              max={5}
              step="0.1"
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={reviewRatingValue}
              onChange={(e) => setReviewRatingValue(e.target.value)}
            />
          </label>
        </div>
      </Surface>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-md px-4 py-2 text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
        {productId ? (
          <button
            type="button"
            onClick={() => void remove()}
            className="rounded-md border px-4 py-2 text-sm font-bold"
            style={{ borderColor: "var(--border)", color: "#f87171" }}
          >
            حذف
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.push(onCancelHref)}
          className="rounded-md border px-4 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
