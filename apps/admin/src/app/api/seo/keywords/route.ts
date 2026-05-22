import { NextResponse } from "next/server";

export const runtime = "nodejs";

type KeywordResult = {
  keyword: string;
  count: number;
  density: number;
  positions: number[];
};

function extractText(html: string): string {
  // Remove scripts, styles, and HTML tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeKeywords(text: string, minLength = 3, topN = 30): KeywordResult[] {
  const stopWords = new Set([
    "و", "در", "به", "از", "که", "این", "را", "با", "است", "برای", "آن", "یک", "هم",
    "تا", "اما", "یا", "هر", "ما", "شما", "او", "آنها", "می", "شد", "شده", "بود",
    "باید", "اگر", "چه", "کی", "کجا", "چرا", "چطور", "the", "a", "an", "and", "or",
    "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is", "are",
    "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "not", "no", "it",
    "its", "this", "that", "these", "those", "i", "we", "you", "he", "she", "they",
  ]);

  const words = text.toLowerCase().split(/\s+/).filter((w) => {
    const clean = w.replace(/[^\u0600-\u06FFa-z0-9]/g, "");
    return clean.length >= minLength && !stopWords.has(clean);
  });

  const totalWords = words.length;
  const freq: Map<string, { count: number; positions: number[] }> = new Map();

  words.forEach((rawWord, idx) => {
    const word = rawWord.replace(/[^\u0600-\u06FFa-z0-9]/g, "");
    if (!word) return;
    const entry = freq.get(word) ?? { count: 0, positions: [] };
    entry.count++;
    entry.positions.push(idx + 1);
    freq.set(word, entry);
  });

  return Array.from(freq.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topN)
    .map(([keyword, { count, positions }]) => ({
      keyword,
      count,
      density: totalWords > 0 ? Math.round((count / totalWords) * 10000) / 100 : 0,
      positions: positions.slice(0, 5),
    }));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { html?: string; url?: string; minLength?: number; topN?: number };

    let html = body.html ?? "";

    if (!html && body.url) {
      try {
        const target = new URL(body.url);
        const response = await fetch(target.toString(), {
          headers: {
            "user-agent": "Medalino-SEO-Scanner/1.0",
            accept: "text/html",
          },
        });
        if (!response.ok) {
          return NextResponse.json({ ok: false, error: `دریافت صفحه ناموفق (${response.status})` }, { status: 400 });
        }
        html = await response.text();
      } catch {
        return NextResponse.json({ ok: false, error: "آدرس URL معتبر نیست یا قابل دسترس نبود." }, { status: 400 });
      }
    }

    if (!html) {
      return NextResponse.json({ ok: false, error: "یکی از فیلدهای html یا url الزامی است." }, { status: 400 });
    }

    const text = extractText(html);
    const totalWords = text.split(/\s+/).filter(Boolean).length;
    const keywords = analyzeKeywords(text, body.minLength ?? 3, body.topN ?? 30);

    return NextResponse.json({ ok: true, keywords, totalWords });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
