import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readProducts, writeProducts } from "@/lib/cms-files";
import { mergeProductPayload } from "@/lib/cms-product-payload";
import type { CmsProduct } from "@repo/cms/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, products: readProducts() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsProduct>;
    const merged = mergeProductPayload(body);
    if (!merged.name || !merged.slug) {
      return NextResponse.json({ ok: false, message: "name_and_slug_required" }, { status: 400 });
    }
    const products = readProducts();
    if (products.some((p) => p.slug === merged.slug)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    const product: CmsProduct = { ...merged, id: randomUUID() };
    products.unshift(product);
    writeProducts(products);
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
