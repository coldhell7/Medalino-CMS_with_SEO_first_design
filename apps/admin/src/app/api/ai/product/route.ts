import { createHash } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { getEffectiveGeminiApiKey, getGeminiModelName } from "@/lib/gemini-settings";
import {
  getEffectiveOpenRouterApiKey,
  getOpenRouterModel,
  getOpenRouterBaseUrl,
  getDefaultAiProvider,
  getEffectiveDeepSeekApiKey,
  getProductPrompt,
} from "@/lib/site-settings";
import { trackUsage } from "@/lib/ai-usage";

export const runtime = "nodejs";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function buildPrompt(title: string, body: string, keywords: string) {
  const template = getProductPrompt();
  return template
    .replace(/\{title\}/g, `Product title:\n${title}`)
    .replace(/\{body\}/g, body ? `Existing description:\n${body.slice(0, 1000)}` : "")
    .replace(/\{keywords\}/g, keywords ? `Keywords / focus: ${keywords}` : "");
}

function parseDraft(text: string) {
  let draft: unknown = { raw: text };
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) draft = JSON.parse(jsonMatch[0] as string);
  } catch {
    // keep raw draft
  }
  return draft;
}

async function tryGemini(title: string, body: string, keywords: string) {
  const geminiKey = getEffectiveGeminiApiKey();
  if (!geminiKey) return null;

  const prompt = buildPrompt(title, body, keywords);
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
  const result = await model.generateContent(prompt);
  const meta = result.response.usageMetadata;
  if (meta) trackUsage("gemini", meta.promptTokenCount ?? 0, meta.candidatesTokenCount ?? 0);
  return result.response.text();
}

async function tryOpenRouter(title: string, body: string, keywords: string) {
  const apiKey = getEffectiveOpenRouterApiKey();
  if (!apiKey) return null;

  const baseUrl = getOpenRouterBaseUrl().replace(/\/$/, "");
  const model = getOpenRouterModel();
  const prompt = buildPrompt(title, body, keywords);

  const res = await fetch(`${baseUrl}/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${errBody}`);
  }

  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const orUsage = json.usage;
  if (orUsage) trackUsage("openrouter", orUsage.prompt_tokens ?? 0, orUsage.completion_tokens ?? 0);
  return json.choices?.[0]?.message?.content ?? null;
}

async function tryDeepSeek(title: string, body: string, keywords: string) {
  const apiKey = getEffectiveDeepSeekApiKey();
  if (!apiKey) return null;

  const prompt = buildPrompt(title, body, keywords);

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${errBody}`);
  }

  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const dsUsage = json.usage;
  if (dsUsage) trackUsage("deepseek", dsUsage.prompt_tokens ?? 0, dsUsage.completion_tokens ?? 0);
  return json.choices?.[0]?.message?.content ?? null;
}

export async function POST(req: Request) {
  try {
    const jsonBody = (await req.json()) as { title?: string; body?: string; keywords?: string };
    const title = jsonBody.title?.trim() || "محصول بدون عنوان";
    const existingBody = jsonBody.body?.trim() || "";
    const keywords = jsonBody.keywords?.trim() || "";

    const redis = getRedis();
    const cacheKey = `ai:product:${createHash("sha256").update(`${title}|${keywords}`).digest("hex")}`;

    if (redis) {
      const hits = await redis.incr("ratelimit:ai:product");
      if (hits === 1) await redis.expire("ratelimit:ai:product", 60);
      if (hits > 20) {
        return NextResponse.json({ error: "محدودیت نرخ درخواست؛ لحظاتی بعد دوباره تلاش کنید." }, { status: 429 });
      }

      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ source: "cache", workflow: "ai_generated", draft: cached });
      }
    }

    const defaultProvider = getDefaultAiProvider();
    const tryOrder = [
      ...new Set([
        defaultProvider,
        ...(["deepseek", "openrouter", "gemini"] as const).filter((p) => p !== defaultProvider),
      ]),
    ];

    let text: string | null = null;
    let source = "";
    const errors: string[] = [];
    for (const p of tryOrder) {
      try {
        if (p === "deepseek") text = await tryDeepSeek(title, existingBody, keywords);
        else if (p === "openrouter") text = await tryOpenRouter(title, existingBody, keywords);
        else text = await tryGemini(title, existingBody, keywords);
        if (text) { source = p; break; }
      } catch (e) {
        errors.push(`${p}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!text) {
      return NextResponse.json({
        error: `هیچ سرویس هوش مصنوعی در دسترس نیست.\n${errors.join("\n")}`,
      }, { status: 400 });
    }

    const draft = parseDraft(text);

    if (redis) {
      await redis.set(cacheKey, draft, { ex: 60 * 60 });
    }

    return NextResponse.json({
      source,
      workflow: "ai_generated",
      draft,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
