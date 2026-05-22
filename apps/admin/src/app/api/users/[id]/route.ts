import { NextResponse } from "next/server";
import { updateDemoUser, type UserRole } from "@/server/demo-users-store";

export const runtime = "nodejs";

function parseRole(v: unknown): UserRole | null {
  const s = String(v ?? "").trim();
  if (s === "admin" || s === "sales" || s === "customer") return s;
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    email?: string;
    full_name?: string;
    phone?: string;
    role?: string;
    active?: boolean;
  };

  const patch: Record<string, unknown> = {};
  if (body.full_name !== undefined) patch.full_name = String(body.full_name).trim();
  if (body.email !== undefined) patch.email = String(body.email).trim().toLowerCase();
  if (body.phone !== undefined) patch.phone = String(body.phone).trim();
  if (body.role !== undefined) {
    const role = parseRole(body.role);
    if (!role) {
      return NextResponse.json({ ok: false, message: "نقش نامعتبر است." }, { status: 400 });
    }
    patch.role = role;
  }
  if (body.active !== undefined) patch.active = Boolean(body.active);

  const user = updateDemoUser(id, patch);
  if (!user) {
    return NextResponse.json({ ok: false, message: "کاربر یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user });
}
