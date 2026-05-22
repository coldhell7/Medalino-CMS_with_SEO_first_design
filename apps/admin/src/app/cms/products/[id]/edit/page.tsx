"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CmsProductForm } from "@/components/CmsProductForm";
import type { CmsProduct } from "@repo/cms/types";

export default function EditProductPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [product, setProduct] = useState<CmsProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/cms/products/${id}`);
        const j = await res.json();
        if (!j.ok) {
          setMsg(j.message ?? "یافت نشد");
          setLoading(false);
          return;
        }
        setProduct(j.product as CmsProduct);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="p-8 text-sm">در حال بارگذاری…</p>;
  if (!product && msg) return <p className="p-8 text-sm text-red-400">{msg}</p>;
  if (!product) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/cms/products" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
          ← بازگشت
        </Link>
        <h1 className="text-2xl font-semibold">ویرایش محصول</h1>
      </div>
      <CmsProductForm productId={product.id} initial={product} onCancelHref="/cms/products" />
    </div>
  );
}
