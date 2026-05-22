"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Surface } from "@repo/ui/react";
import type { CmsProduct } from "@repo/cms/types";

const storefrontUrl = "http://localhost:4321";

export default function CmsProductsListPage() {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "publish" | "draft">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"none" | "publish" | "draft" | "delete" | "feature" | "unfeature">("none");
  const [bulkLoading, setBulkLoading] = useState(false);
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.metaTitle && p.metaTitle.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && p.featured) ||
        (featuredFilter === "not-featured" && !p.featured);
      return matchSearch && matchStatus && matchFeatured;
    });
  }, [products, search, statusFilter, featuredFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const executeBulkAction = async () => {
    if (selectedIds.size === 0 || bulkAction === "none") return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const promises = ids.map(async (id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return;

        let method: string;
        let body: Record<string, unknown>;

        if (bulkAction === "delete") {
          method = "DELETE";
          body = {};
        } else {
          method = "PUT";
          body = {
            status:
              bulkAction === "publish"
                ? "publish"
                : bulkAction === "draft"
                  ? "draft"
                  : product.status,
            featured:
              bulkAction === "feature"
                ? true
                : bulkAction === "unfeature"
                  ? false
                  : product.featured,
          };
        }

        await fetch(`/api/cms/products/${id}`, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      });

      await Promise.all(promises);
      setSelectedIds(new Set());
      setBulkAction("none");

      const res = await fetch("/api/cms/products");
      const j = await res.json();
      if (j.ok) setProducts(j.products ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkLoading(false);
    }
  };

  const formatNumber = (n: number) => hydrated ? n.toLocaleString("fa-IR") : String(n);

  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === "publish").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">محصولات</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            قیمت، سئو، اسکیمای Product/Offer و انتشار روی فروشگاه از همین‌جا.
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "کل", value: totalCount, color: "var(--text)" },
          { label: "منتشر", value: publishedCount, color: "#22c55e" },
          { label: "پیش‌نویس", value: draftCount, color: "#f59e0b" },
          { label: "ویژه", value: featuredCount, color: "#3b82f6" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border p-3"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-xl font-bold" style={{ color: stat.color }}>
              {formatNumber(stat.value)}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex flex-wrap items-center gap-3 rounded-md border p-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <div className="flex-1 min-w-[200px]">
          <input
            className="w-full rounded-md border p-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نام، نامک، عنوان سئو..."
            dir="ltr"
          />
        </div>
        <select
          className="rounded-md border p-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="publish">منتشر</option>
          <option value="draft">پیش‌نویس</option>
        </select>
        <select
          className="rounded-md border p-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
        >
          <option value="all">همه</option>
          <option value="featured">ویژه</option>
          <option value="not-featured">عادی</option>
        </select>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatNumber(filteredProducts.length)} محصول
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border p-3"
          style={{ borderColor: "var(--accent)", background: "var(--bg-elevated)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            {formatNumber(selectedIds.size)} انتخاب‌شده
          </span>
          <div className="flex gap-2">
            {[
              { value: "publish", label: "انتشار" },
              { value: "draft", label: "پیش‌نویس" },
              { value: "feature", label: "ویژه کردن" },
              { value: "unfeature", label: "حذف ویژه" },
              { value: "delete", label: "حذف" },
            ].map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => setBulkAction(action.value as typeof bulkAction)}
                className="rounded px-3 py-1.5 text-xs font-medium"
                style={{
                  background: bulkAction === action.value ? "var(--accent)" : "var(--surface)",
                  color: bulkAction === action.value ? "#fff" : "var(--text)",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void executeBulkAction()}
            disabled={bulkLoading || bulkAction === "none"}
            className="rounded-md px-4 py-1.5 text-xs font-bold text-white"
            style={{ background: "var(--accent)", opacity: bulkLoading || bulkAction === "none" ? 0.5 : 1 }}
          >
            {bulkLoading ? "در حال اجرا…" : "اجرا"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedIds(new Set());
              setBulkAction("none");
            }}
            className="rounded px-3 py-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            لغو انتخاب
          </button>
        </div>
      )}

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <Surface title="فهرست">
        <div className="overflow-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr>
                <th className="pb-2 w-8">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </th>
                <th className="pb-2">نام</th>
                <th className="pb-2">نامک</th>
                <th className="pb-2">وضعیت</th>
                <th className="pb-2">ویژه</th>
                <th className="pb-2">قیمت (تومان)</th>
                <th className="pb-2">موجودی</th>
                <th className="pb-2">عنوان سئو</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {search || statusFilter !== "all" || featuredFilter !== "all"
                      ? "محصولی با این فیلترها یافت نشد"
                      : "هنوز محصولی ثبت نشده"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t"
                    style={{
                      borderColor: "var(--border)",
                      background: selectedIds.has(p.id) ? "var(--surface)" : "transparent",
                    }}
                  >
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 font-mono text-xs">{p.slug}</td>
                    <td className="py-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background: p.status === "publish" ? "#dcfce7" : "var(--surface)",
                          color: p.status === "publish" ? "#16a34a" : "var(--text-muted)",
                        }}
                      >
                        {p.status === "publish" ? "منتشر" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td className="py-2">
                      {p.featured ? (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                          ویژه
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-2">{formatNumber(p.priceToman)}</td>
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
                    <td className="max-w-[200px] truncate py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {p.metaTitle}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/cms/products/${p.id}/edit`}
                          className="font-bold no-underline"
                          style={{ color: "var(--accent)" }}
                        >
                          ویرایش
                        </Link>
                        {p.status === "publish" ? (
                          <a
                            href={`${storefrontUrl}/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold no-underline"
                            style={{ color: "var(--text-muted)" }}
                          >
                            فروشگاه
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        پس از ذخیره در محیط استاتیک، فروشگاه را دوباره build کنید تا تغییرات روی سایت بیاید.
      </p>
    </div>
  );
}
