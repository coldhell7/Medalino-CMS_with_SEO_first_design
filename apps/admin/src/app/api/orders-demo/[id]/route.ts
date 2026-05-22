import { NextResponse } from "next/server";
import { normalizeStatus, type OrderStatus } from "@/lib/order-stages";
import { updateDemoOrderStatus } from "@/server/demo-orders-store";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: string };
  const status = normalizeStatus(body.status ?? "");
  if (!body.status) {
    return NextResponse.json({ ok: false, message: "وضعیت مشخص نشده." }, { status: 400 });
  }

  const order = updateDemoOrderStatus(id, status as OrderStatus);
  if (!order) {
    return NextResponse.json({ ok: false, message: "سفارش یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
