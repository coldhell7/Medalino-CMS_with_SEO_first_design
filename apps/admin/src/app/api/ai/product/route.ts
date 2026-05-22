import { createHash } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { getEffectiveGeminiApiKey, getGeminiModelName } from "@/lib/gemini-settings";

export const runtime = "nodejs";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST(req: Request) {
  const geminiKey = getEffectiveGeminiApiKey();
  if (!geminiKey) {
    return NextResponse.json(
      {
        error:
          "کلید Gemini تنظیم نشده. در بخش «محتوا و هوش مصنوعی» توکن را ذخیره کنید یا متغیر GEMINI_API_KEY را در محیط اجرا قرار دهید.",
      },
      { status: 400 },
    );
  }

  try {
    const body = (await req.json()) as { title?: string; keywords?: string };
    const title = body.title?.trim() || "محصول بدون عنوان";
    const keywords = body.keywords?.trim() || "";

    const redis = getRedis();
    const cacheKey = `gemini:product:${createHash("sha256").update(`${title}|${keywords}`).digest("hex")}`;

    if (redis) {
      const hits = await redis.incr("ratelimit:ai:product");
      if (hits === 1) await redis.expire("ratelimit:ai:product", 60);
      if (hits > 20) {
        return NextResponse.json({ error: "محدودیت نرخ درخواست؛ لحظاتی بعد دوباره تلاش کنید." }, { status: 429 });
      }

      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ source: "cache", draft: cached });
      }
    }

    const prompt = [
      "You are an ecommerce copywriter for a health-adjacent catalog.",
      "Return STRICT JSON with keys: metaTitle (<=120 chars), metaDescription (<=320 chars), description (2 short paragraphs), imageAlts (array of 3 strings), workflowHint (string).",
      "All human-facing string values in the JSON must be in Persian (Farsi), RTL-friendly wording.",
      "Avoid medical claims. Include keywords naturally:",
      keywords,
      "Product title:",
      title,
    ].join("\n");

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let draft: unknown = { raw: text };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) draft = JSON.parse(jsonMatch[0] as string);
    } catch {
      // keep raw draft
    }

    if (redis) {
      await redis.set(cacheKey, draft, { ex: 60 * 60 });
    }

    return NextResponse.json({
      source: "model",
      workflow: "ai_generated",
      draft,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
