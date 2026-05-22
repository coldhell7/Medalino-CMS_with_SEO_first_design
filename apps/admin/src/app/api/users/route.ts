import { NextResponse } from "next/server";
import { createDemoUser, listDemoUsers, type UserRole } from "@/server/demo-users-store";

export const runtime = "nodejs";

function parseRole(v: unknown): UserRole | null {
  const s = String(v ?? "").trim();
  if (s === "admin" || s === "sales" || s === "customer") return s;
  return null;
}

export async function GET() {
  const users = listDemoUsers();
  return NextResponse.json({ ok: true, users });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    full_name?: string;
    phone?: string;
    role?: string;
    active?: boolean;
  };
  const role = parseRole(body.role);
  const email = String(body.email ?? "").trim().toLowerCase();
  const full_name = String(body.full_name ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!role) {
    return NextResponse.json({ ok: false, message: "نقش نامعتبر است." }, { status: 400 });
  }
  if (!email || !full_name) {
    return NextResponse.json({ ok: false, message: "ایمیل و نام الزامی است." }, { status: 400 });
  }

  const users = listDemoUsers();
  if (users.some((u) => u.email === email)) {
    return NextResponse.json({ ok: false, message: "این ایمیل قبلاً ثبت شده." }, { status: 409 });
  }

  const user = createDemoUser({
    email,
    full_name,
    phone,
    role,
    active: body.active !== false,
  });

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
