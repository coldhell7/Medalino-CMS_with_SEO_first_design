import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  jar.delete(getCookieName());
  return NextResponse.json({ ok: true });
}
