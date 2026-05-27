"use client";

import { useState } from "react";

type Props = {
  title: string;
  body?: string;
  keywords?: string;
  endpoint: "/api/ai/content" | "/api/ai/product";
  onMetaTitle: (val: string) => void;
  onMetaDescription: (val: string) => void;
  onSlug?: (val: string) => void;
  onBody?: (val: string) => void;
  onExcerpt?: (val: string) => void;
};

export default function AiMetaButton({
  title, body, keywords, endpoint,
  onMetaTitle, onMetaDescription,
  onSlug, onBody, onExcerpt,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!title.trim()) {
      setError("ابتدا عنوان را وارد کنید.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body: body || "", keywords: keywords || "" }),
      });
      const raw = await res.text();
      const json = raw.trim()
        ? (JSON.parse(raw) as { error?: string; draft?: unknown })
        : { error: `پاسخ خالی (${res.status})` };
      if (!res.ok || json.error) {
        setError(json.error ?? "خطا");
        return;
      }
      const d = json.draft as Record<string, unknown> | undefined;
      if (!d || typeof d !== "object" || "raw" in d) {
        setError("خروجی مدل قابل اعمال نبود.");
        return;
      }
      if (typeof d.metaTitle === "string" && d.metaTitle.trim()) onMetaTitle(d.metaTitle.trim());
      if (typeof d.metaDescription === "string" && d.metaDescription.trim()) onMetaDescription(d.metaDescription.trim());
      if (onSlug && typeof d.slug === "string" && d.slug.trim()) onSlug(d.slug.trim());
      if (onBody && typeof d.body === "string" && d.body.trim()) onBody(d.body.trim());
      if (onExcerpt && typeof d.excerpt === "string" && d.excerpt.trim()) onExcerpt(d.excerpt.trim());
      if (onBody && typeof d.description === "string" && d.description.trim()) onBody(d.description.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading || !title.trim()}
        onClick={() => void handleClick()}
        className="rounded-md px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {loading ? "در حال تولید…" : "تکمیل با هوش مصنوعی"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
