"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsPage } from "@repo/cms/types";
import { formatJalaliDate } from "@repo/shared";

export default function EditPagePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

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
        setPage(p);
        setTitle(p.title);
        setSlug(p.slug);
        setBody(p.body);
        setStatus(p.status);
        setDate(p.date);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const runAiOptimize = async () => {
    const t = title.trim();
    if (!t) {
      setMsg("برای تکمیل خودکار ابتدا عنوان را وارد کنید.");
      return;
    }
    setAiLoading(true);
    setMsg(null);
    try {
      const hint = stripHtml(body).slice(0, 500) || t;
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, keywords: hint }),
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
        setMsg("خروجی مدل قابل اعمال نبود.");
        return;
      }
      if (typeof d.metaTitle === "string" && d.metaTitle.trim()) setTitle(d.metaTitle.trim());
      if (typeof d.body === "string" && d.body.trim()) setBody(d.body.trim());
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
      const res = await fetch(`/api/cms/pages/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug, body, status, date }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.message ?? "خطا");
        return;
      }
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
  if (!page && msg) return <p className="p-8 text-sm text-red-400">{msg}</p>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/cms/pages" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
            ← بازگشت
          </Link>
          <h1 className="text-2xl font-semibold">ویرایش برگه</h1>
        </div>
        <button
          type="button"
          disabled={aiLoading || saving || !title.trim()}
          onClick={() => void runAiOptimize()}
          className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {aiLoading ? "در حال تولید…" : "تکمیل / بهینه‌سازی با هوش مصنوعی"}
        </button>
      </div>
      {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
      <Surface title="محتوا">
        <label className="block text-sm font-medium">
          عنوان
          <input
            className="mt-1 w-full rounded-md border p-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          نامک
          <input
            className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          زمان ذخیره‌شده (ISO — برای ویرایش دقیق)
          <input
            className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
            نمایش شمسی: {date ? formatJalaliDate(date, { time: true }) : "—"}
          </span>
        </label>
        <label className="mt-4 block text-sm font-medium">
          متن (HTML)
          <textarea
            className="mt-1 w-full rounded-md border p-2 font-mono text-xs"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          وضعیت
          <select
            className="mt-1 w-full rounded-md border p-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "publish")}
          >
            <option value="draft">پیش‌نویس</option>
            <option value="publish">منتشر شده</option>
          </select>
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-md px-4 py-2 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            className="rounded-md border px-4 py-2 text-sm font-bold"
            style={{ borderColor: "var(--border)", color: "#f87171" }}
          >
            حذف
          </button>
        </div>
      </Surface>
    </div>
  );
}
