import { NextResponse } from "next/server";
import { getEffectiveOpenRouterApiKey, getOpenRouterModel, getOpenRouterBaseUrl } from "@/lib/site-settings";

export const runtime = "nodejs";

export async function GET() {
  const key = getEffectiveOpenRouterApiKey();
  if (!key) {
    return NextResponse.json({ ok: false, models: [], message: "کلید OpenRouter تنظیم نشده است." });
  }

  const baseUrl = getOpenRouterBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/api/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, models: [], message: `OpenRouter: ${res.status} ${text.slice(0, 200)}` }, { status: 502 });
    }
    const data = (await res.json()) as { data: Array<{ id: string; name: string }> };
    const current = getOpenRouterModel();
    return NextResponse.json({
      ok: true,
      models: data.data.map((m) => ({ id: m.id, name: m.name, selected: m.id === current })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, models: [], message: e instanceof Error ? e.message : "خطا در ارتباط با OpenRouter" }, { status: 502 });
  }
}
