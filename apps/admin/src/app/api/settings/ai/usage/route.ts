import { NextResponse } from "next/server";
import { getUsage, getTotalUsage } from "@/lib/ai-usage";

export const runtime = "nodejs";

export async function GET() {
  const usage = getUsage();
  const totals = getTotalUsage();
  return NextResponse.json({ ok: true, usage, totals });
}
