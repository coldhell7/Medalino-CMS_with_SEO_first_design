import { NextResponse } from "next/server";
import { readMedia, writeMedia } from "@/lib/cms-files";
import type { CmsMedia } from "@repo/cms/types";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, media: readMedia() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsMedia>;
    const url = String(body.url ?? "").trim();
    const alt = String(body.alt ?? "").trim();
    if (!url) {
      return NextResponse.json({ ok: false, message: "url_required" }, { status: 400 });
    }
    const items = readMedia();
    const item: CmsMedia = {
      id: randomUUID(),
      url,
      alt,
      date: new Date().toISOString(),
    };
    items.unshift(item);
    writeMedia(items);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
