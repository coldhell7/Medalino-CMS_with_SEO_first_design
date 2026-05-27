import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const CMS_DIR = path.resolve(process.cwd(), "../../packages/cms/content");

function readJson(filename: string): unknown[] {
  return JSON.parse(fs.readFileSync(path.join(CMS_DIR, filename), "utf8"));
}

export async function GET() {
  try {
    const products = readJson("products.json") as Record<string, unknown>[];
    const posts = readJson("posts.json") as Record<string, unknown>[];
    const items: {
      type: "product" | "post";
      id: string;
      slug: string;
      name: string;
      metaTitle: string;
      metaDescription: string;
      bodyHtml?: string;
      body?: string;
      issues: string[];
    }[] = [];

    for (const p of products) {
      const issues: string[] = [];
      const mt = String(p.metaTitle ?? "").trim();
      const md = String(p.metaDescription ?? "").trim();
      if (!mt) issues.push("metaTitle خالی");
      else if (mt.length < 30) issues.push(`metaTitle کوتاه (${mt.length} کاراکتر)`);
      if (!md) issues.push("metaDescription خالی");
      else if (md.length < 100) issues.push(`metaDescription کوتاه (${md.length} کاراکتر)`);
      if (issues.length > 0) {
        items.push({
          type: "product",
          id: String(p.id),
          slug: String(p.slug),
          name: String(p.name),
          metaTitle: mt,
          metaDescription: md,
          bodyHtml: String(p.bodyHtml ?? ""),
          issues,
        });
      }
    }

    for (const p of posts) {
      const issues: string[] = [];
      const mt = String(p.metaTitle ?? "").trim();
      const md = String(p.metaDescription ?? "").trim();
      if (!mt) issues.push("metaTitle خالی");
      else if (mt.length < 30) issues.push(`metaTitle کوتاه (${mt.length} کاراکتر)`);
      if (!md) issues.push("metaDescription خالی");
      else if (md.length < 50) issues.push(`metaDescription کوتاه (${md.length} کاراکتر)`);
      if (issues.length > 0) {
        items.push({
          type: "post",
          id: String(p.id),
          slug: String(p.slug),
          name: String(p.title),
          metaTitle: mt,
          metaDescription: md,
          body: String(p.body ?? ""),
          issues,
        });
      }
    }

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
