import { NextResponse } from "next/server";
import { readPages, writePages } from "@/lib/cms-files";
import type { CmsPage } from "@repo/cms/types";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, pages: readPages() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsPage>;
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!title || !slug) {
      return NextResponse.json({ ok: false, message: "title_and_slug_required" }, { status: 400 });
    }
    const pages = readPages();
    if (pages.some((p) => p.slug === slug)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const page: CmsPage = {
      id: randomUUID(),
      slug,
      title,
      body: String(body.body ?? "").trim() || "<p></p>",
      status: body.status === "publish" ? "publish" : "draft",
      date: body.date && String(body.date).trim() ? String(body.date) : now,
      categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
      coverImage: body.coverImage ? String(body.coverImage) : undefined,
      metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
      metaDescription: body.metaDescription ? String(body.metaDescription) : undefined,
    };
    pages.unshift(page);
    writePages(pages);
    return NextResponse.json({ ok: true, page });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
