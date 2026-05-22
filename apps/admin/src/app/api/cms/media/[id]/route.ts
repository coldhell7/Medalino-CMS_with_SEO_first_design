import { NextResponse } from "next/server";
import { readMedia, writeMedia } from "@/lib/cms-files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const all = readMedia();
  const items = all.filter((m) => m.id !== id);
  if (items.length === all.length) {
    return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
  }
  writeMedia(items);
  return NextResponse.json({ ok: true });
}
