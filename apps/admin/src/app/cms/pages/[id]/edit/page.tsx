"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import RichEditor from "@/components/RichEditor";
import ImageUploader from "@/components/ImageUploader";
import AiMetaButton from "@/components/AiMetaButton";
import type { CmsPage } from "@repo/cms/types";

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [coverImage, setCoverImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const autoSlug = (t: string) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/cms/pages/${id}`);
        const j = await res.json();
        if (!j.ok) {
          setMsg(j.message ?? "یافت نشد");
          setLoading(false);
          return;
        }
        const p = j.page as CmsPage;
        setTitle(p.title);
        setSlug(p.slug);
        setBody(p.body);
        setStatus(p.status);
        setCoverImage(p.coverImage ?? "");
        setMetaTitle(p.metaTitle ?? "");
        setMetaDescription(p.metaDescription ?? "");
        setLoaded(true);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/cms/pages/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || autoSlug(title),
          body,
          status,
          coverImage: coverImage || undefined,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setMsg(j.message ?? "خطا"); return; }
      router.push("/cms/pages");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("حذف این برگه؟")) return;
    const res = await fetch(`/api/cms/pages/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/cms/pages");
    else setMsg("حذف نشد");
  };

  if (loading) return <p className="p-8 text-sm">در حال بارگذاری…</p>;
  if (!loaded && msg) return <p className="p-8 text-sm text-red-400">{msg}</p>;
  if (!loaded) return null;

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cms/pages" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
            ← بازگشت
          </Link>
          <h1 className="text-2xl font-semibold">ویرایش برگه</h1>
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
          <button
            type="button"
            onClick={() => void remove()}
            className="rounded-md border px-3 py-2 text-sm font-bold"
            style={{ borderColor: "var(--border)", color: "#f87171" }}
          >
            حذف
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-red-400">{msg}</p>}

      <AiMetaButton
        title={title}
        body={body}
        endpoint="/api/ai/content"
        onMetaTitle={setMetaTitle}
        onMetaDescription={setMetaDescription}
        onSlug={setSlug}
        onBody={setBody}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Surface title="عنوان">
            <input
              className="w-full rounded-md border p-3 text-lg font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
              placeholder="عنوان برگه را وارد کنید…"
            />
          </Surface>

          <Surface title="محتوا">
            <RichEditor value={body} onChange={setBody} placeholder="محتوای برگه را بنویسید…" />
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
                  placeholder="page-slug"
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
                  placeholder={stripHtml(body) || "توضیحات متا…"}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(metaDescription || stripHtml(body)).length}/160
                </p>
              </label>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
