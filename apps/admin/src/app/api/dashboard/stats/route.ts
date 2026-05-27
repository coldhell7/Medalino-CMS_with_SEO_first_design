import { NextResponse } from "next/server";
import { readProducts, readPosts, readPages } from "@/lib/cms-files";
import { getTotalUsage, getUsage } from "@/lib/ai-usage";

export const runtime = "nodejs";

export async function GET() {
  const products = readProducts();
  const posts = readPosts();
  const pages = readPages();
  const usage = getUsage();
  const totals = getTotalUsage();

  return NextResponse.json({
    ok: true,
    products: {
      total: products.length,
      published: products.filter((p) => p.status === "publish").length,
      draft: products.filter((p) => p.status === "draft").length,
    },
    posts: {
      total: posts.length,
      published: posts.filter((p) => p.status === "publish").length,
      draft: posts.filter((p) => p.status === "draft").length,
    },
    pages: {
      total: pages.length,
      published: pages.filter((p) => p.status === "publish").length,
      draft: pages.filter((p) => p.status === "draft").length,
    },
    tokenUsage: usage,
    tokenTotals: totals,
  });
}
