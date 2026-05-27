import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getEffectiveOpenRouterApiKey, getOpenRouterModel, getOpenRouterBaseUrl } from "@/lib/site-settings";

export const runtime = "nodejs";

const CMS_DIR = path.resolve(process.cwd(), "../../packages/cms/content");

function readJson(filename: string): unknown[] {
  return JSON.parse(fs.readFileSync(path.join(CMS_DIR, filename), "utf8"));
}

export async function POST(req: Request) {
  try {
    const { type, id } = (await req.json()) as { type: "product" | "post"; id: string };

    let name: string;
    let summary: string;
    let body: string;

    if (type === "product") {
      const products = readJson("products.json") as Record<string, unknown>[];
      const item = products.find((p) => p.id === id);
      if (!item) {
        return NextResponse.json({ ok: false, message: "محصول یافت نشد" }, { status: 404 });
      }
      name = String(item.name ?? "");
      summary = String(item.summary ?? "");
      body = String(item.bodyHtml ?? "");
    } else {
      const posts = readJson("posts.json") as Record<string, unknown>[];
      const item = posts.find((p) => p.id === id);
      if (!item) {
        return NextResponse.json({ ok: false, message: "مطلب یافت نشد" }, { status: 404 });
      }
      name = String(item.title ?? "");
      summary = String(item.excerpt ?? "");
      body = String(item.body ?? "");
    }

    const apiKey = getEffectiveOpenRouterApiKey();
    if (!apiKey) {
      return NextResponse.json({ ok: false, message: "کلید OpenRouter تنظیم نشده است." });
    }

    const model = getOpenRouterModel();
    const baseUrl = getOpenRouterBaseUrl();
    const truncatedBody = body.slice(0, 500);

    const res = await fetch(`${baseUrl}/api/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "تو یک متخصص سئو فارسی هستی. برای محصولات وبسایت مکمل‌های غذایی متا تایتل و متا دیسکریپشن تولید می‌کنی.",
          },
          {
            role: "user",
            content: `برای محصول زیر متا تایتل (بین ۵۰ تا ۶۰ کاراکتر) و متا دیسکریپشن (بین ۱۰۰ تا ۱۶۰ کاراکتر) به فارسی تولید کن:\n\nنام: ${name}\nخلاصه: ${summary}\nتوضیحات: ${truncatedBody}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, message: `OpenRouter: ${res.status} ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Record<string, string>;

    return NextResponse.json({
      ok: true,
      metaTitle: content.metaTitle ?? content.title ?? "",
      metaDescription: content.metaDescription ?? content.description ?? "",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
