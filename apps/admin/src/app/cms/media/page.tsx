"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsMedia } from "@repo/cms/types";
import { formatJalaliDate } from "@repo/shared";

export default function CmsMediaPage() {
  const [items, setItems] = useState<CmsMedia[]>([]);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/cms/media");
    const j = await res.json();
    if (j.ok) setItems(j.media ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/cms/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, alt }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.message ?? "خطا");
        return;
      }
      setUrl("");
      setAlt("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const del = async (id: string) => {
    if (!confirm("حذف این مورد؟")) return;
    await fetch(`/api/cms/media/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">رسانه</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          ثبت آدرس فایل تصویر (مثل <span className="font-mono">/images/...</span> یا URL کامل). آپلود فایل در این نسخه نیست.
        </p>
      </div>
      <Surface title="افزودن">
        {err ? <p className="mb-2 text-sm text-red-400">{err}</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">
            آدرس تصویر
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/images/hero-home.svg"
            />
          </label>
          <label className="text-sm font-medium">
            متن جایگزین
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void add()}
          className="mt-4 rounded-md px-4 py-2 text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          افزودن به کتابخانه
        </button>
      </Surface>
      <Surface title="فهرست">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="mb-2 h-32 w-full rounded object-cover" />
              <p className="break-all font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                {m.url}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {formatJalaliDate(m.date, { time: true })}
              </p>
              <button type="button" className="mt-2 text-xs font-bold text-red-400" onClick={() => void del(m.id)}>
                حذف
              </button>
            </div>
          ))}
        </div>
      </Surface>
      <Link href="/cms" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
        ← بازگشت به مدیریت محتوا
      </Link>
    </div>
  );
}
