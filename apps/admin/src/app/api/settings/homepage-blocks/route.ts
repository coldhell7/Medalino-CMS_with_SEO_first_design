import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import type { CmsBlock } from "@repo/cms/types";

const BLOCKS_FILE = path.join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "cms",
  "content",
  "homepage-blocks.json",
);

function readBlocks(): CmsBlock[] {
  try {
    if (!fs.existsSync(BLOCKS_FILE)) return [];
    return JSON.parse(fs.readFileSync(BLOCKS_FILE, "utf8")) as CmsBlock[];
  } catch {
    return [];
  }
}

function writeBlocks(blocks: CmsBlock[]): void {
  const dir = path.dirname(BLOCKS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blocks, null, 2), "utf8");
}

export const runtime = "nodejs";

export async function GET() {
  const blocks = readBlocks();
  return NextResponse.json({ ok: true, blocks });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { blocks: CmsBlock[] };
    if (!Array.isArray(body.blocks)) {
      return NextResponse.json({ ok: false, message: "blocks must be an array" }, { status: 400 });
    }
    writeBlocks(body.blocks);
    return NextResponse.json({ ok: true, blocks: body.blocks });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "خطا" },
      { status: 400 },
    );
  }
}
