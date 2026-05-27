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
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/cms/media");
      const j = await res.json();
      if (!j.ok) {
        setErr(j.message ?? "خطا در بارگذاری");
        return;
      }
      setItems(j.media ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    setAdding(true);
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
    } finally {
      setAdding(false);
    }
  };

  const del = async (id: string) => {
    setDeletingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/cms/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.message ?? "حذف نشد");
        return;
      }
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
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
          disabled={adding}
          onClick={() => void add()}
          className="mt-4 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {adding ? "در حال افزودن…" : "افزودن به کتابخانه"}
        </button>
      </Surface>

      <Surface title="فهرست">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            در حال بارگذاری…
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            هیچ رسانه‌ای ثبت نشده است.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <div key={m.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} className="mb-2 h-32 w-full rounded object-cover" />
                <p className="break-all font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {m.url}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {hydrated ? formatJalaliDate(m.date, { time: true }) : m.date}
                </p>

                {confirmDeleteId === m.id ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={deletingId === m.id}
                      onClick={() => void del(m.id)}
                      className="rounded bg-red-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {deletingId === m.id ? "…" : "تأیید حذف"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-3 py-1 text-xs font-bold"
                      style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                      انصراف
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="mt-2 text-xs font-bold text-red-400"
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>

      <Link href="/cms" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
        ← بازگشت به مدیریت محتوا
      </Link>
    </div>
  );
}
