"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsProduct } from "@repo/cms/types";

export default function CmsProductsPage() {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    void (async () => {
      try {
        const res = await fetch("/api/cms/products");
        const j = await res.json();
        if (!j.ok) setErr(j.message ?? "خطا");
        else setProducts(j.products ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">محصولات</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            ایجاد، ویرایش و انتشار محصولات.
          </p>
        </div>
        <Link
          href="/cms/products/new"
          className="rounded-md px-4 py-2 text-sm font-bold text-white no-underline"
          style={{ background: "var(--accent)" }}
        >
          محصول جدید
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
                <th className="pb-2">نام</th>
                <th className="pb-2">نامک</th>
                <th className="pb-2">وضعیت</th>
                <th className="pb-2">قیمت (تومان)</th>
                <th className="pb-2">موجودی</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    هنوز محصولی ثبت نشده
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 font-mono text-xs">{p.slug}</td>
                    <td className="py-2">{p.status === "publish" ? "منتشر" : "پیش‌نویس"}</td>
                    <td className="py-2">
                      {hydrated && typeof p.priceToman === "number" ? p.priceToman.toLocaleString("fa-IR") : String(p.priceToman ?? "—")}
                    </td>
                    <td className="py-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background:
                            p.availability === "InStock"
                              ? "#dcfce7"
                              : p.availability === "OutOfStock"
                                ? "#fef2f2"
                                : "#fef3c7",
                          color:
                            p.availability === "InStock"
                              ? "#16a34a"
                              : p.availability === "OutOfStock"
                                ? "#dc2626"
                                : "#d97706",
                        }}
                      >
                        {p.availability === "InStock"
                          ? "موجود"
                          : p.availability === "OutOfStock"
                            ? "ناموجود"
                            : "پیش‌فروش"}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://medalino.ir/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold no-underline"
                          style={{ color: "var(--text-muted)" }}
                        >
                          مشاهده
                        </a>
                        <Link
                          href={`/cms/products/${p.id}/edit`}
                          className="font-bold no-underline"
                          style={{ color: "var(--accent)" }}
                        >
                          ویرایش
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
