import { NextResponse } from "next/server";
import {
  getEffectiveGeminiApiKey,
  getEffectiveOpenRouterApiKey,
  getEffectiveDeepSeekApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterModel,
} from "@/lib/site-settings";

export const runtime = "nodejs";

function maskKey(k: string): string {
  const t = k.trim();
  if (t.length <= 8) return "••••••••";
  return t.slice(0, 3) + "••••" + t.slice(-4);
}

async function testGemini(): Promise<string | null> {
  const key = getEffectiveGeminiApiKey();
  if (!key) return null;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "سلام" }] }] }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return "اتصال موفق به Gemini";
}

async function testOpenRouter(): Promise<string | null> {
  const key = getEffectiveOpenRouterApiKey();
  if (!key) return null;
  const baseUrl = getOpenRouterBaseUrl().replace(/\/$/, "");
  const model = getOpenRouterModel();
  const url = `${baseUrl}/api/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.PUBLIC_ADMIN_URL || "https://admin.medalino.ir",
      "X-Title": "Medalino",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "سلام" }],
      max_tokens: 10,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter ${res.status}: ${body.slice(0, 200)} ` +
      `[key:${maskKey(key)} len:${key.length} model:${model} url:${url}]`,
    );
  }
  return "اتصال موفق به OpenRouter";
}

async function testDeepSeek(): Promise<string | null> {
  const key = getEffectiveDeepSeekApiKey();
  if (!key) return null;
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "سلام" }],
      max_tokens: 10,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return "اتصال موفق به DeepSeek";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { provider?: string };
    const provider = body.provider?.trim() || "deepseek";

    let message: string | null = null;
    if (provider === "gemini") message = await testGemini();
    else if (provider === "openrouter") message = await testOpenRouter();
    else message = await testDeepSeek();

    if (!message) {
      return NextResponse.json(
        { ok: false, message: `هیچ توکنی برای ${provider} پیکربندی نشده است.` },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, message });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
