"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Surface } from "@repo/ui/react";
import RichEditor from "@/components/RichEditor";
import ImageUploader from "@/components/ImageUploader";
import AiMetaButton from "@/components/AiMetaButton";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [featured, setFeatured] = useState(false);
  const [priceToman, setPriceToman] = useState("");
  const [originalPriceToman, setOriginalPriceToman] = useState("");
  const [badge, setBadge] = useState("");
  const [availability, setAvailability] = useState<"InStock" | "OutOfStock" | "PreOrder">("InStock");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const autoSlug = (t: string) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "");

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        name,
        slug: slug || autoSlug(name),
        summary,
        bodyHtml,
        status,
        featured,
        priceToman: parseInt(priceToman) || 0,
        availability,
        image: image || undefined,
        imageAlt: imageAlt || name,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || summary,
      };
      if (originalPriceToman) body.originalPriceToman = parseInt(originalPriceToman);
      if (badge) body.badge = badge;

      const res = await fetch("/api/cms/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) { setMsg(j.message ?? "خطا"); return; }
      router.push("/cms/products");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cms/products" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
            ← بازگشت
          </Link>
          <h1 className="text-2xl font-semibold">محصول جدید</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border p-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "publish")}
          >
            <option value="draft">پیش‌نویس</option>
            <option value="publish">منتشر شده</option>
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-md px-6 py-2 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "در حال ذخیره…" : "انتشار"}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-red-400">{msg}</p>}

      <AiMetaButton
        title={name}
        body={bodyHtml}
        endpoint="/api/ai/product"
        onMetaTitle={setMetaTitle}
        onMetaDescription={setMetaDescription}
        onSlug={setSlug}
        onBody={(v) => setBodyHtml(v)}
        onExcerpt={setSummary}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Surface title="نام محصول">
            <input
              className="w-full rounded-md border p-3 text-lg font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={name}
              onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
              placeholder="نام محصول را وارد کنید…"
            />
          </Surface>

          <Surface title="محتوا">
            <RichEditor value={bodyHtml} onChange={setBodyHtml} placeholder="محتوای محصول را بنویسید…" />
          </Surface>

          <Surface title="خلاصه">
            <textarea
              className="w-full rounded-md border p-3 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="خلاصه کوتاه برای نمایش در لیست…"
            />
          </Surface>
        </div>

        <div className="flex flex-col gap-6">
          <Surface title="تنظیمات انتشار">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">
                نامک (slug)
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="example-slug"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4"
                />
                محصول ویژه
              </label>
            </div>
          </Surface>

          <Surface title="قیمت و تخفیف">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">
                قیمت (تومان)
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  type="number"
                  value={priceToman}
                  onChange={(e) => setPriceToman(e.target.value)}
                  placeholder="۰"
                />
              </label>
              <label className="text-sm font-medium">
                قیمت قدیم (تومان)
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  type="number"
                  value={originalPriceToman}
                  onChange={(e) => setOriginalPriceToman(e.target.value)}
                  placeholder="۰"
                />
              </label>
              <label className="text-sm font-medium">
                برچسب
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="تخفیف ویژه"
                />
              </label>
            </div>
          </Surface>

          <Surface title="موجودی">
            <select
              className="w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={availability}
              onChange={(e) => setAvailability(e.target.value as typeof availability)}
            >
              <option value="InStock">موجود</option>
              <option value="OutOfStock">ناموجود</option>
              <option value="PreOrder">پیش‌فروش</option>
            </select>
          </Surface>

          <Surface title="تصویر">
            <ImageUploader value={image} onChange={setImage} label="" size="medium" />
            <label className="mt-3 block text-sm font-medium">
              متن جایگزین
              <input
                className="mt-1 w-full rounded-md border p-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder={name || "توضیح تصویر…"}
              />
            </label>
          </Surface>

          <Surface title="سئو">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">
                عنوان سئو
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={name || "عنوان سئو…"}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(metaTitle || name).length}/60
                </p>
              </label>
              <label className="text-sm font-medium">
                توضیحات متا
                <textarea
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={summary || "توضیحات متا…"}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(metaDescription || summary).length}/160
                </p>
              </label>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
