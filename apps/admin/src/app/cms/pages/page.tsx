"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsPage } from "@repo/cms/types";
import { formatJalaliDate } from "@repo/shared";

export default function CmsPagesListPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/pages");
        const j = await res.json();
        if (!j.ok) setErr(j.message ?? "خطا");
        else setPages(j.pages ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">برگه‌ها</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            صفحات ثابت؛ در فروشگاه آدرس آن‌ها <span className="font-mono">/p/نامک</span> است.
          </p>
        </div>
        <Link
          href="/cms/pages/new"
          className="rounded-md px-4 py-2 text-sm font-bold text-white no-underline"
          style={{ background: "var(--accent)" }}
        >
          برگهٔ جدید
        </Link>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <Surface title="فهرست">
        <table className="w-full text-start text-sm">
          <thead>
            <tr>
              <th className="pb-2">عنوان</th>
              <th className="pb-2">نامک</th>
              <th className="pb-2">وضعیت</th>
              <th className="pb-2">تاریخ</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 font-medium">{p.title}</td>
                <td className="py-2 font-mono text-xs">{p.slug}</td>
                <td className="py-2">{p.status === "publish" ? "منتشر" : "پیش‌نویس"}</td>
                <td className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatJalaliDate(p.date, { time: true })}
                </td>
                <td className="py-2">
                  <Link href={`/cms/pages/${p.id}/edit`} className="font-bold no-underline" style={{ color: "var(--accent)" }}>
                    ویرایش
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
  );
}
