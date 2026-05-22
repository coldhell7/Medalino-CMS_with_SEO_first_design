import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OgData = {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterSite: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  favicon: string;
};

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractLink(html: string, rel: string): string {
  const patterns = [
    new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`, "i"),
    new RegExp(`<link[^>]*href=["']([^"']*)["'][^>]*rel=["']${rel}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

function resolveUrl(base: string, relative: string): string {
  if (!relative) return "";
  if (relative.startsWith("http")) return relative;
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; html?: string; baseUrl?: string };

    let html = body.html ?? "";
    let pageUrl = body.baseUrl ?? body.url ?? "";

    if (!html && body.url) {
      try {
        const target = new URL(body.url);
        pageUrl = target.toString();
        const response = await fetch(pageUrl, {
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

    const pageTitle = extractTitle(html);
    const ogData: OgData = {
      title: extractMeta(html, "og:title") || pageTitle,
      description: extractMeta(html, "og:description") || extractMeta(html, "description"),
      image: resolveUrl(pageUrl, extractMeta(html, "og:image")),
      url: extractMeta(html, "og:url") || pageUrl,
      siteName: extractMeta(html, "og:site_name"),
      type: extractMeta(html, "og:type") || "website",
      twitterCard: extractMeta(html, "twitter:card") || "summary",
      twitterSite: extractMeta(html, "twitter:site"),
      twitterTitle: extractMeta(html, "twitter:title") || pageTitle,
      twitterDescription: extractMeta(html, "twitter:description") || extractMeta(html, "description"),
      twitterImage: resolveUrl(pageUrl, extractMeta(html, "twitter:image") || extractMeta(html, "og:image")),
      canonical: extractLink(html, "canonical"),
      favicon: resolveUrl(pageUrl, extractLink(html, "icon") || extractLink(html, "shortcut icon") || "/favicon.ico"),
    };

    // Scoring
    const checks = [
      { key: "og:title", ok: !!ogData.title, label: "og:title" },
      { key: "og:description", ok: !!ogData.description, label: "og:description" },
      { key: "og:image", ok: !!ogData.image, label: "og:image" },
      { key: "og:url", ok: !!ogData.url, label: "og:url" },
      { key: "og:site_name", ok: !!ogData.siteName, label: "og:site_name" },
      { key: "twitter:card", ok: !!ogData.twitterCard, label: "twitter:card" },
      { key: "twitter:title", ok: !!ogData.twitterTitle, label: "twitter:title" },
      { key: "twitter:description", ok: !!ogData.twitterDescription, label: "twitter:description" },
      { key: "twitter:image", ok: !!ogData.twitterImage, label: "twitter:image" },
      { key: "canonical", ok: !!ogData.canonical, label: "canonical link" },
    ];

    const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

    return NextResponse.json({ ok: true, ogData, checks, score });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
