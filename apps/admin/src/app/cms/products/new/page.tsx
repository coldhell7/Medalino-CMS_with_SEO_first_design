"use client";

import Link from "next/link";
import { CmsProductForm } from "@/components/CmsProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/cms/products" className="text-sm font-bold no-underline" style={{ color: "var(--accent)" }}>
          ← بازگشت
        </Link>
        <h1 className="text-2xl font-semibold">محصول جدید</h1>
      </div>
      <CmsProductForm onCancelHref="/cms/products" />
    </div>
  );
}
