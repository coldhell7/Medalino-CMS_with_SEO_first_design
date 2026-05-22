import SeoAnalyzer from "seo-analyzer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { html?: string; url?: string };
  let html = body.html;

  if (!html && body.url) {
    try {
      const target = new URL(body.url);
      const response = await fetch(target.toString(), {
        headers: {
          "user-agent": "Medalino-SEO-Scanner/1.0 (+https://medalino.ir)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      if (!response.ok) {
        return NextResponse.json({ error: `دریافت صفحه ناموفق بود (${response.status}).` }, { status: 400 });
      }
      html = await response.text();
    } catch {
      return NextResponse.json({ error: "آدرس URL معتبر نیست یا قابل دسترس نبود." }, { status: 400 });
    }
  }

  if (!html) {
    return NextResponse.json({ error: "یکی از فیلدهای html یا url الزامی است." }, { status: 400 });
  }

  try {
    let report: unknown = null;
    const analyzer = new SeoAnalyzer({ verbose: false });
    analyzer
      .inputHTMLStrings([{ source: "admin-panel", text: html }])
      .useRule("titleLengthRule")
      .useRule("metaDescriptionRule")
      .useRule("canonicalLinkRule")
      .useRule("imgTagWithAltAttributeRule")
      .outputObject((obj) => {
        report = obj;
      });
    await analyzer.run();
    return NextResponse.json({ ok: true, report, html: html.substring(0, 500_000) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "seo-analyzer در این محیط اجرا نشد.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
