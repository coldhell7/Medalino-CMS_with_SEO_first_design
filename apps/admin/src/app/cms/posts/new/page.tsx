"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Surface } from "@repo/ui/react";
import RichEditor from "@/components/RichEditor";
import ImageUploader from "@/components/ImageUploader";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [categories, setCategories] = useState("سلامت");
  const [coverImage, setCoverImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const autoSlug = (t: string) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "");

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cms/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || autoSlug(title),
          excerpt,
          body,
          status,
          categories: categories.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
          coverImage,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || excerpt,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setMsg(j.message ?? "خطا"); return; }
      router.push("/cms/posts");
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
          <Link href="/cms/posts" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
            ← بازگشت
          </Link>
          <h1 className="text-2xl font-semibold">نوشتهٔ جدید</h1>
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

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Surface title="عنوان">
            <input
              className="w-full rounded-md border p-3 text-lg font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
              placeholder="عنوان نوشته را وارد کنید…"
            />
          </Surface>

          <Surface title="محتوا">
            <RichEditor value={body} onChange={setBody} placeholder="محتوای نوشته را بنویسید…" />
          </Surface>

          <Surface title="خلاصه">
            <textarea
              className="w-full rounded-md border p-3 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
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
              <label className="text-sm font-medium">
                دسته‌ها (با ویرگول)
                <input
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                />
              </label>
            </div>
          </Surface>

          <Surface title="تصویر شاخص">
            <ImageUploader value={coverImage} onChange={setCoverImage} label="" size="medium" />
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
                  placeholder={title || "عنوان سئو…"}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(metaTitle || title).length}/60
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
                  placeholder={excerpt || "توضیحات متا…"}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(metaDescription || excerpt).length}/160
                </p>
              </label>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
