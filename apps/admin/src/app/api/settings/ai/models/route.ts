import { NextResponse } from "next/server";
import { getEffectiveOpenRouterApiKey, getOpenRouterBaseUrl } from "@/lib/site-settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const key = getEffectiveOpenRouterApiKey();
    if (!key) {
      return NextResponse.json({ ok: false, message: "OpenRouter توکنی پیکربندی نشده است." }, { status: 400 });
    }

    const baseUrl = getOpenRouterBaseUrl().replace(/\/$/, "");
    const res = await fetch(`${baseUrl}/api/v1/models`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.PUBLIC_ADMIN_URL || "https://admin.medalino.ir",
        "X-Title": "Medalino",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, message: `OpenRouter ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, models: data.data || [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
