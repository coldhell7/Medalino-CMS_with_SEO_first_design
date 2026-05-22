import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionValue, getCookieName, getPassword, getUsername } from "@/lib/admin-auth";

export const runtime = "nodejs";

function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    try {
      timingSafeEqual(ba, ba);
    } catch {
      /* ignore */
    }
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string; password?: string };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!timingSafeStringEqual(username, getUsername()) || !timingSafeStringEqual(password, getPassword())) {
    return NextResponse.json({ ok: false, message: "نام کاربری یا رمز نادرست است." }, { status: 401 });
  }

  const value = await createSessionValue();
  const jar = await cookies();
  jar.set(getCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
