"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Surface } from "@repo/ui/react";

export default function NewPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"), body, status }),
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/cms/pages" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
          ← بازگشت
        </Link>
        <h1 className="text-2xl font-semibold">برگهٔ جدید</h1>
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
          متن (HTML)
          <textarea
            className="mt-1 w-full rounded-md border p-2 font-mono text-xs"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            rows={12}
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
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="mt-6 rounded-md px-4 py-2 text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
      </Surface>
    </div>
  );
}
