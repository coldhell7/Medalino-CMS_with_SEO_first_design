"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsPost } from "@repo/cms/types";
import { formatJalaliDate } from "@repo/shared";

export default function CmsPostsPage() {
  const [posts, setPosts] = useState<CmsPost[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    void (async () => {
      try {
        const res = await fetch("/api/cms/posts");
        const j = await res.json();
        if (!j.ok) setErr(j.message ?? "خطا");
        else setPosts(j.posts ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">نوشته‌ها</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            ایجاد، ویرایش و تغییر وضعیت پیش‌نویس / منتشر شده.
          </p>
        </div>
        <Link
          href="/cms/posts/new"
          className="rounded-md px-4 py-2 text-sm font-bold text-white no-underline"
          style={{ background: "var(--accent)" }}
        >
          نوشتهٔ جدید
        </Link>
      </div>
      {err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : null}
      <Surface title="فهرست">
        <div className="overflow-auto">
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
              {posts.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 font-medium">{p.title}</td>
                  <td className="py-2 font-mono text-xs">{p.slug}</td>
                  <td className="py-2">{p.status === "publish" ? "منتشر" : "پیش‌نویس"}</td>
                  <td className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {hydrated ? formatJalaliDate(p.date, { time: true }) : p.date}
                  </td>
                  <td className="py-2">
                    <Link href={`/cms/posts/${p.id}/edit`} className="font-bold no-underline" style={{ color: "var(--accent)" }}>
                      ویرایش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
