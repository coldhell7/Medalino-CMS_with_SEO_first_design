import { NextResponse } from "next/server";
import { listDemoOrders } from "@/server/demo-orders-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = listDemoOrders();
    return NextResponse.json({ ok: true, source: "json-file-demo", orders });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        source: "json-file-demo",
        message: e instanceof Error ? e.message : String(e),
        orders: [],
      },
      { status: 500 },
    );
  }
}
