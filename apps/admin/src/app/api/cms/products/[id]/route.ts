import { NextResponse } from "next/server";
import { readProducts, writeProducts } from "@/lib/cms-files";
import { mergeProductPayload } from "@/lib/cms-product-payload";
import type { CmsProduct } from "@repo/cms/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const product = readProducts().find((p) => p.id === id);
  if (!product) return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<CmsProduct>;
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
  const cur = products[idx]!;
  const merged = mergeProductPayload(body, cur);
  if (merged.slug !== cur.slug && products.some((p) => p.slug === merged.slug && p.id !== id)) {
    return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
  }
  merged.id = cur.id;
  products[idx] = merged;
  writeProducts(products);
  return NextResponse.json({ ok: true, product: merged });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const all = readProducts();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) {
    return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
  }
  writeProducts(next);
  return NextResponse.json({ ok: true });
}
