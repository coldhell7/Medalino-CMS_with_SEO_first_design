"use client";

import { useEffect, useState, useCallback } from "react";

type SeoSettings = {
  robotsTxt: string;
  llmsTxt: string;
  sitemapEnabled: boolean;
  metaTitleTemplate: string;
  metaDescriptionTemplate: string;
  ogImageDefault: string;
  canonicalBaseUrl: string;
  structuredDataEnabled: boolean;
  twitterCardType: string;
  twitterSite: string;
  twitterCreator: string;
  ogTypeDefault: string;
  ogSiteName: string;
  fbAppId: string;
  enableLazyLoading: boolean;
  enablePreload: boolean;
  enablePrefetch: boolean;
  enableHttpsRedirect: boolean;
  enableSecurityHeaders: boolean;
  hstsMaxAge: number;
};

type AnalysisIssue = {
  rule: string;
  level: "error" | "warning" | "info";
  message: string;
};

type AnalysisReport = {
  score?: number;
  issues?: AnalysisIssue[];
  title?: string;
  metaDescription?: string;
  canonical?: string;
  missingAltCount?: number;
  totalImages?: number;
  titleLength?: number;
  metaDescriptionLength?: number;
  raw?: unknown;
};

type ValidationIssue = {
  line: number;
  message: string;
  level: "error" | "warning" | "info";
};

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

type KeywordResult = {
  keyword: string;
  count: number;
  density: number;
  positions: number[];
};

type OgCheck = { key: string; ok: boolean; label: string };

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

type SeoAnalyzerReportEntry = { source: string; report: string[] };

// ─── HTML helpers ────────────────────────────────────────────────────────────
function extractTitleFromHtml(html: string) {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
}
function extractMetaDescriptionFromHtml(html: string) {
  return (
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim() ??
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1]?.trim() ??
    ""
  );
}
function extractCanonicalFromHtml(html: string) {
  return (
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1]?.trim() ??
    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i)?.[1]?.trim() ??
    ""
  );
}
function countImgWithoutAlt(html: string) {
  const all = html.match(/<img\b[^>]*>/gi) ?? [];
  const missing = all.filter((t) => !/\balt=["'][^"']*["']/i.test(t)).length;
  return { missing, total: all.length };
}

function parseReport(raw: unknown, html = ""): AnalysisReport {
  const issues: AnalysisIssue[] = [];
  let rawMessages: string[] = [];

  if (Array.isArray(raw)) {
    for (const e of raw as SeoAnalyzerReportEntry[]) {
      if (Array.isArray(e.report)) rawMessages = rawMessages.concat(e.report);
    }
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.report)) rawMessages = obj.report as string[];
  }

  const title = extractTitleFromHtml(html);
  const metaDescription = extractMetaDescriptionFromHtml(html);
  const canonical = extractCanonicalFromHtml(html);
  const { missing: imgMissing, total: totalImages } = countImgWithoutAlt(html);
  const titleLength = title.length;
  const metaDescriptionLength = metaDescription.length;

  if (!title) issues.push({ rule: "title", level: "error", message: "تگ title یافت نشد." });
  else if (titleLength < 30) issues.push({ rule: "title", level: "warning", message: `عنوان کوتاه است (${titleLength} کاراکتر). حداقل ۳۰ توصیه می‌شود.` });
  else if (titleLength > 60) issues.push({ rule: "title", level: "warning", message: `عنوان بلند است (${titleLength} کاراکتر). حداکثر ۶۰ توصیه می‌شود.` });

  if (!metaDescription) issues.push({ rule: "metaDescription", level: "error", message: "تگ meta description یافت نشد." });
  else if (metaDescriptionLength < 100) issues.push({ rule: "metaDescription", level: "warning", message: `توضیحات کوتاه است (${metaDescriptionLength} کاراکتر). حداقل ۱۰۰ توصیه می‌شود.` });
  else if (metaDescriptionLength > 160) issues.push({ rule: "metaDescription", level: "warning", message: `توضیحات بلند است (${metaDescriptionLength} کاراکتر). حداکثر ۱۶۰ توصیه می‌شود.` });

  if (!canonical) issues.push({ rule: "canonical", level: "warning", message: "لینک canonical یافت نشد." });

  if (imgMissing > 0) issues.push({ rule: "alt", level: "warning", message: `${imgMissing} تصویر از ${totalImages} فاقد alt هستند.` });

  for (const msg of rawMessages) {
    if (!issues.some((i) => i.message.includes(msg.substring(0, 20)))) {
      const level: "error" | "warning" | "info" = /missing|too short|error/i.test(msg) ? "warning" : "info";
      issues.push({ rule: "general", level, message: msg });
    }
  }

  let score = 100;
  for (const i of issues) score -= i.level === "error" ? 25 : i.level === "warning" ? 10 : 0;

  return { score: Math.max(0, score), issues, title, metaDescription, canonical, missingAltCount: imgMissing, totalImages, titleLength, metaDescriptionLength, raw };
}

// ─── Shared UI helpers ───────────────────────────────────────────────────────
const card = { borderColor: "var(--border)", background: "var(--bg-elevated)" } as const;
const surface = { borderColor: "var(--border)", background: "var(--surface)" } as const;

function Badge({ level }: { level: "error" | "warning" | "info" }) {
  const bg = level === "error" ? "#ef4444" : level === "warning" ? "#f59e0b" : "#3b82f6";
  const label = level === "error" ? "خطا" : level === "warning" ? "هشدار" : "اطلاع";
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: bg }}>
      {label}
    </span>
  );
}

function IssueList({ issues }: { issues: AnalysisIssue[] }) {
  if (!issues.length) return (
    <div className="rounded-md border p-4 text-center text-sm" style={{ borderColor: "#22c55e", background: "#f0fdf4", color: "#16a34a" }}>
      هیچ مشکلی یافت نشد. سئو این صفحه در وضعیت خوبی است.
    </div>
  );
  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue, i) => (
        <li key={i} className="flex items-start gap-2 rounded-md border p-3 text-sm" style={{ borderColor: issue.level === "error" ? "#ef4444" : issue.level === "warning" ? "#f59e0b" : "var(--border)", background: "var(--surface)" }}>
          <Badge level={issue.level} />
          <span style={{ color: "var(--text)" }}>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

function Btn({ children, onClick, disabled, variant = "primary" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "outline" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md px-4 py-2 text-sm font-semibold transition"
      style={{
        background: variant === "primary" ? "var(--accent)" : "transparent",
        color: variant === "primary" ? "#fff" : "var(--text)",
        border: variant === "outline" ? "1px solid var(--border)" : "none",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

type TabId = "overview" | "analyzer" | "settings" | "sitemap" | "robots" | "indexing" | "audit" | "keywords" | "ogpreview" | "webp";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:4321";

const QUICK_PAGES = [
  { label: "صفحه اصلی", path: "/" },
  { label: "محصولات", path: "/#featured" },
  { label: "بلاگ", path: "/blog" },
];

// ─── Root Page ───────────────────────────────────────────────────────────────
export default function SeoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);

  useEffect(() => {
    void fetch("/api/settings/seo").then((r) => r.json()).then((j) => { if (j.ok) setSeoSettings(j.settings); }).catch(() => null);
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "نمای کلی" },
    { id: "analyzer", label: "تحلیلگر" },
    { id: "keywords", label: "کلمات کلیدی" },
    { id: "ogpreview", label: "پیش‌نمایش OG" },
    { id: "webp", label: "تبدیل WebP" },
    { id: "settings", label: "تنظیمات" },
    { id: "sitemap", label: "Sitemap" },
    { id: "robots", label: "Robots.txt" },
    { id: "indexing", label: "اینکسینگ" },
    { id: "audit", label: "بررسی سریع" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--text)" }}>مدیریت سئو</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>تنظیمات سئو، نقشه سایت، robots.txt، تحلیل صفحات و پیش‌نمایش شبکه‌های اجتماعی</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b pb-0" style={{ borderColor: "var(--border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition"
            style={{
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--text)" : "var(--text-muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview"   && <OverviewTab settings={seoSettings} onTabChange={setActiveTab} />}
      {activeTab === "analyzer"   && <AnalyzerTab />}
      {activeTab === "keywords"   && <KeywordsTab />}
      {activeTab === "ogpreview"  && <OgPreviewTab />}
      {activeTab === "webp"       && <WebpTab />}
      {activeTab === "settings"   && <SettingsTab />}
      {activeTab === "sitemap"    && <SitemapTab />}
      {activeTab === "robots"     && <RobotsTab initialContent={seoSettings?.robotsTxt ?? ""} />}
      {activeTab === "indexing"   && <IndexingTab />}
      {activeTab === "audit"      && <AuditTab />}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ settings, onTabChange }: { settings: SeoSettings | null; onTabChange: (t: TabId) => void }) {
  const [stats, setStats] = useState({ productsCount: 0, publishedCount: 0, sitemapUrls: 0 });
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    void Promise.all([fetch("/api/cms/products"), fetch("/api/seo/sitemap")]).then(async ([pr, sr]) => {
      const pj = await pr.json();
      const st = await sr.text();
      const products = pj.products ?? [];
      setStats({
        productsCount: products.length,
        publishedCount: products.filter((p: { status: string }) => p.status === "publish").length,
        sitemapUrls: (st.match(/<url>/g) ?? []).length,
      });
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => hydrated ? n.toLocaleString("fa-IR") : String(n);

  const statCards = [
    { label: "محصولات منتشرشده", value: fmt(stats.publishedCount), color: "var(--accent)" },
    { label: "کل محصولات", value: fmt(stats.productsCount), color: "var(--text)" },
    { label: "آدرس‌های Sitemap", value: fmt(stats.sitemapUrls), color: "#3b82f6" },
    { label: "وضعیت Robots.txt", value: settings?.robotsTxt ? "✓ فعال" : "✗ ندارد", color: settings?.robotsTxt ? "#22c55e" : "#ef4444" },
  ];

  const statusItems = [
    { label: "Sitemap فعال است", ok: true },
    { label: `robots.txt ${settings?.robotsTxt ? "تنظیم شده" : "تنظیم نشده"}`, ok: !!settings?.robotsTxt },
    { label: `داده‌های ساختاری ${settings?.structuredDataEnabled ? "فعال" : "غیرفعال"}`, ok: !!settings?.structuredDataEnabled },
    { label: `Canonical URL ${settings?.canonicalBaseUrl ? "تنظیم شده" : "تنظیم نشده"}`, ok: !!settings?.canonicalBaseUrl },
    { label: `Twitter Card: ${settings?.twitterCardType ?? "—"}`, ok: !!settings?.twitterCardType },
    { label: `OG Site Name: ${settings?.ogSiteName ?? "—"}`, ok: !!settings?.ogSiteName },
  ];

  const quickLinks: { tab: TabId; title: string; desc: string }[] = [
    { tab: "analyzer", title: "تحلیلگر سئو", desc: "بررسی سئو هر صفحه با URL یا HTML" },
    { tab: "keywords", title: "کلمات کلیدی", desc: "تراکم و توزیع کلمات کلیدی صفحه" },
    { tab: "ogpreview", title: "پیش‌نمایش OG", desc: "نمایش کارت شبکه‌های اجتماعی" },
    { tab: "settings", title: "تنظیمات سئو", desc: "قالب متا، Open Graph و شبکه‌های اجتماعی" },
    { tab: "sitemap", title: "نقشه سایت", desc: "مشاهده و مدیریت sitemap.xml" },
    { tab: "robots", title: "Robots.txt", desc: "مدیریت دسترسی ربات‌های جستجو" },
    { tab: "indexing", title: "اینکسینگ", desc: "ارسال URL به Google Indexing API" },
    { tab: "audit", title: "بررسی سریع", desc: "بررسی دسته‌جمعی صفحات اصلی" },
  ];

  if (loading) return <p className="p-8" style={{ color: "var(--text-muted)" }}>در حال بارگذاری…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-md border p-4" style={card}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{c.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>وضعیت فعلی سئو</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-sm" style={{ color: "var(--text)" }}>
          {statusItems.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.ok ? "#22c55e" : "#ef4444" }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>دسترسی سریع</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className="cursor-pointer rounded-md border p-3 text-start transition hover:border-[var(--accent)]"
              style={surface}
            >
              <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{item.title}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Analyzer Tab ────────────────────────────────────────────────────────────
function ReportDisplay({ report }: { report: AnalysisReport }) {
  const scoreColor = (report.score ?? 0) >= 80 ? "#22c55e" : (report.score ?? 0) >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6 rounded-md border p-4" style={card}>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold" style={{ background: scoreColor, color: "#fff" }}>
          {report.score ?? "—"}
        </div>
        <div className="flex flex-col gap-1 text-sm" style={{ color: "var(--text)" }}>
          {report.title && <span><strong>عنوان:</strong> {report.title} ({report.titleLength} کاراکتر)</span>}
          {report.metaDescription && <span><strong>توضیحات:</strong> {report.metaDescription.slice(0, 80)}{(report.metaDescription.length ?? 0) > 80 ? "…" : ""} ({report.metaDescriptionLength} کاراکتر)</span>}
          {report.canonical && <span><strong>Canonical:</strong> <span dir="ltr">{report.canonical}</span></span>}
          {report.totalImages !== undefined && <span><strong>تصاویر:</strong> {report.totalImages} تصویر {(report.missingAltCount ?? 0) > 0 ? `(${report.missingAltCount} بدون alt)` : ""}</span>}
        </div>
      </div>
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>مشکلات و هشدارها</h3>
        <IssueList issues={report.issues ?? []} />
      </div>
    </div>
  );
}

function AnalyzerTab() {
  const [mode, setMode] = useState<"url" | "html">("url");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState("");

  const analyze = useCallback(async () => {
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await fetch("/api/seo/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(mode === "url" ? { url: input } : { html: input }) });
      const j = await res.json();
      if (j.ok) {
        const html = (j.html as string) ?? (mode === "html" ? input : "");
        setReport(parseReport(j.report, html));
      } else {
        setError(j.error ?? j.message ?? "خطا در تحلیل");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "خطا"); }
    finally { setLoading(false); }
  }, [mode, input]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4" style={card}>
        <div className="mb-3 flex gap-2">
          {(["url", "html"] as const).map((m) => (
            <Btn key={m} variant={mode === m ? "primary" : "outline"} onClick={() => setMode(m)}>
              {m === "url" ? "آدرس URL" : "HTML خام"}
            </Btn>
          ))}
        </div>
        {mode === "url" ? (
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
            آدرس صفحه
            <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="http://localhost:4321/products/..." dir="ltr" />
          </label>
        ) : (
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
            کد HTML
            <textarea className="mt-1 w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} rows={10} dir="ltr" placeholder="<html>...</html>" />
          </label>
        )}
        <div className="mt-4">
          <Btn onClick={() => void analyze()} disabled={loading || !input.trim()}>
            {loading ? "در حال تحلیل…" : "تحلیل سئو"}
          </Btn>
        </div>
      </div>
      {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: "#ef4444", background: "#fef2f2", color: "#dc2626" }}>{error}</div>}
      {report && <ReportDisplay report={report} />}
    </div>
  );
}

// ─── Keywords Tab ────────────────────────────────────────────────────────────
function KeywordsTab() {
  const [mode, setMode] = useState<"url" | "html">("url");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [error, setError] = useState("");

  const analyze = useCallback(async () => {
    setLoading(true); setError(""); setKeywords([]);
    try {
      const body = mode === "url" ? { url: input } : { html: input };
      const res = await fetch("/api/seo/keywords", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.ok) { setKeywords(j.keywords ?? []); setTotalWords(j.totalWords ?? 0); }
      else setError(j.error ?? "خطا");
    } catch (e) { setError(e instanceof Error ? e.message : "خطا"); }
    finally { setLoading(false); }
  }, [mode, input]);

  const maxCount = keywords[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>تحلیل کلمات کلیدی</h3>
        <div className="mb-3 flex gap-2">
          {(["url", "html"] as const).map((m) => (
            <Btn key={m} variant={mode === m ? "primary" : "outline"} onClick={() => setMode(m)}>
              {m === "url" ? "آدرس URL" : "HTML خام"}
            </Btn>
          ))}
        </div>
        {mode === "url" ? (
          <input className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="http://localhost:4321/..." dir="ltr" />
        ) : (
          <textarea className="w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} rows={8} dir="ltr" placeholder="<html>...</html>" />
        )}
        <div className="mt-4">
          <Btn onClick={() => void analyze()} disabled={loading || !input.trim()}>
            {loading ? "در حال تحلیل…" : "تحلیل کلمات کلیدی"}
          </Btn>
        </div>
      </div>

      {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: "#ef4444", background: "#fef2f2", color: "#dc2626" }}>{error}</div>}

      {keywords.length > 0 && (
        <div className="rounded-md border p-4" style={card}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>نتایج ({keywords.length} کلمه)</h3>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>مجموع کلمات: {totalWords.toLocaleString("fa-IR")}</span>
          </div>
          <div className="overflow-auto rounded-md border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>کلمه</th>
                  <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>تعداد</th>
                  <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>تراکم</th>
                  <th className="px-3 py-2 text-start w-40" style={{ color: "var(--text)" }}>نمودار</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 font-medium" style={{ color: "var(--text)" }}>{kw.keyword}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{kw.count}</td>
                    <td className="px-3 py-2" style={{ color: kw.density > 3 ? "#ef4444" : kw.density > 1.5 ? "#f59e0b" : "#22c55e" }}>{kw.density}%</td>
                    <td className="px-3 py-2">
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(kw.count / maxCount) * 100}%`, background: "var(--accent)" }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            تراکم بیش از ۳٪ ممکن است به عنوان keyword stuffing تلقی شود. محدوده ایده‌آل: ۱ تا ۲.۵٪
          </p>
        </div>
      )}
    </div>
  );
}

// ─── OG Preview Tab ──────────────────────────────────────────────────────────
function OgPreviewTab() {
  const [mode, setMode] = useState<"url" | "html">("url");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ogData, setOgData] = useState<OgData | null>(null);
  const [checks, setChecks] = useState<OgCheck[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [previewType, setPreviewType] = useState<"facebook" | "twitter">("facebook");

  const analyze = useCallback(async () => {
    setLoading(true); setError(""); setOgData(null);
    try {
      const body = mode === "url" ? { url: input } : { html: input, baseUrl: "https://medalino.ir" };
      const res = await fetch("/api/seo/og-preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.ok) { setOgData(j.ogData); setChecks(j.checks ?? []); setScore(j.score ?? 0); }
      else setError(j.error ?? "خطا");
    } catch (e) { setError(e instanceof Error ? e.message : "خطا"); }
    finally { setLoading(false); }
  }, [mode, input]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>پیش‌نمایش Open Graph</h3>
        <div className="mb-3 flex gap-2">
          {(["url", "html"] as const).map((m) => (
            <Btn key={m} variant={mode === m ? "primary" : "outline"} onClick={() => setMode(m)}>
              {m === "url" ? "آدرس URL" : "HTML خام"}
            </Btn>
          ))}
        </div>
        {mode === "url" ? (
          <input className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="http://localhost:4321/..." dir="ltr" />
        ) : (
          <textarea className="w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={input} onChange={(e) => setInput(e.target.value)} rows={8} dir="ltr" placeholder="<html>...</html>" />
        )}
        <div className="mt-4">
          <Btn onClick={() => void analyze()} disabled={loading || !input.trim()}>
            {loading ? "در حال بارگذاری…" : "دریافت پیش‌نمایش"}
          </Btn>
        </div>
      </div>

      {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: "#ef4444", background: "#fef2f2", color: "#dc2626" }}>{error}</div>}

      {ogData && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className="flex items-center gap-4 rounded-md border p-4" style={card}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold" style={{ background: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444", color: "#fff" }}>{score}%</div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>امتیاز Open Graph</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{checks.filter((c) => c.ok).length} از {checks.length} تگ موجود است</p>
            </div>
          </div>

          {/* Preview toggle */}
          <div className="flex gap-2">
            <Btn variant={previewType === "facebook" ? "primary" : "outline"} onClick={() => setPreviewType("facebook")}>فیسبوک / واتساپ</Btn>
            <Btn variant={previewType === "twitter" ? "primary" : "outline"} onClick={() => setPreviewType("twitter")}>توییتر / X</Btn>
          </div>

          {/* Facebook preview */}
          {previewType === "facebook" && (
            <div className="rounded-md border overflow-hidden max-w-lg" style={{ borderColor: "#dddfe2", background: "#f0f2f5" }}>
              {ogData.image && <img src={ogData.image} alt="OG" className="w-full object-cover" style={{ maxHeight: 260 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              <div className="p-3" style={{ background: "#f0f2f5" }}>
                <p className="text-xs uppercase" style={{ color: "#606770" }}>{ogData.url ? new URL(ogData.url.startsWith("http") ? ogData.url : "https://example.com").hostname : "example.com"}</p>
                <p className="font-bold text-sm mt-0.5" style={{ color: "#1d2129" }}>{ogData.title || "بدون عنوان"}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#606770" }}>{ogData.description || "بدون توضیحات"}</p>
              </div>
            </div>
          )}

          {/* Twitter preview */}
          {previewType === "twitter" && (
            <div className="rounded-2xl border overflow-hidden max-w-lg" style={{ borderColor: "#e1e8ed", background: "#fff" }}>
              {ogData.twitterImage && <img src={ogData.twitterImage} alt="Twitter" className="w-full object-cover" style={{ maxHeight: 260 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              <div className="p-3">
                <p className="font-bold text-sm" style={{ color: "#14171a" }}>{ogData.twitterTitle || ogData.title || "بدون عنوان"}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#657786" }}>{ogData.twitterDescription || ogData.description || "بدون توضیحات"}</p>
                <p className="text-xs mt-1" style={{ color: "#657786" }}>{ogData.twitterSite || ""}</p>
              </div>
            </div>
          )}

          {/* Checks */}
          <div className="rounded-md border p-4" style={card}>
            <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>بررسی تگ‌ها</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                  <span style={{ color: c.ok ? "#22c55e" : "#ef4444" }}>{c.ok ? "✓" : "✗"}</span>
                  <span className="font-mono text-xs">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: SeoSettings = {
  robotsTxt: "", llmsTxt: "", sitemapEnabled: true,
  metaTitleTemplate: "{title} | {siteName}", metaDescriptionTemplate: "{description}",
  ogImageDefault: "/images/og-default.jpg", canonicalBaseUrl: "https://medalino.ir",
  structuredDataEnabled: true, twitterCardType: "summary_large_image",
  twitterSite: "@medalino", twitterCreator: "@medalino",
  ogTypeDefault: "website", ogSiteName: "Medalino", fbAppId: "",
  enableLazyLoading: true, enablePreload: true, enablePrefetch: true,
  enableHttpsRedirect: true, enableSecurityHeaders: true, hstsMaxAge: 31536000,
};

function SettingsTab() {
  const [settings, setSettings] = useState<SeoSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<"meta" | "og" | "twitter" | "perf" | "llms">("meta");

  useEffect(() => {
    void fetch("/api/settings/seo").then((r) => r.json()).then((j) => { if (j.ok) setSettings((p) => ({ ...p, ...j.settings })); }).catch(() => null).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/settings/seo", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings }) });
      const j = await res.json();
      setMessage(j.ok ? "✓ تنظیمات سئو ذخیره شد." : j.message ?? "خطا در ذخیره");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setSaving(false); }
  };

  const upd = (key: keyof SeoSettings, val: string | boolean | number) => setSettings((p) => ({ ...p, [key]: val }));
  const inp = "mt-1 w-full rounded-md border p-2 text-sm";
  const inpStyle = { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" };

  if (loading) return <p className="p-8" style={{ color: "var(--text-muted)" }}>در حال بارگذاری…</p>;

  const sections = [
    { id: "meta" as const, label: "متا و Canonical" },
    { id: "og" as const, label: "Open Graph" },
    { id: "twitter" as const, label: "Twitter / X" },
    { id: "perf" as const, label: "عملکرد و امنیت" },
    { id: "llms" as const, label: "LLMs.txt" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {message && <div className="rounded-md border p-3 text-sm" style={{ borderColor: message.startsWith("✓") ? "#22c55e" : "#ef4444", background: message.startsWith("✓") ? "#f0fdf4" : "#fef2f2", color: message.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{message}</div>}

      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
        {sections.map((s) => (
          <button key={s.id} type="button" onClick={() => setActiveSection(s.id)} className="whitespace-nowrap px-4 py-2 text-sm font-medium transition" style={{ color: activeSection === s.id ? "var(--text)" : "var(--text-muted)", borderBottom: activeSection === s.id ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: "-1px" }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "meta" && (
        <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>قالب عنوان و توضیحات</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>الگوی عنوان<input className={inp} style={inpStyle} value={settings.metaTitleTemplate} onChange={(e) => upd("metaTitleTemplate", e.target.value)} placeholder="{title} | {siteName}" dir="ltr" /></label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>الگوی توضیحات<input className={inp} style={inpStyle} value={settings.metaDescriptionTemplate} onChange={(e) => upd("metaDescriptionTemplate", e.target.value)} placeholder="{description}" dir="ltr" /></label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Canonical Base URL<input className={inp} style={inpStyle} value={settings.canonicalBaseUrl} onChange={(e) => upd("canonicalBaseUrl", e.target.value)} placeholder="https://medalino.ir" dir="ltr" /></label>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>متغیرها: {"{title}"} {"{siteName}"} {"{category}"} {"{description}"}</p>
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
            <input type="checkbox" checked={settings.sitemapEnabled} onChange={(e) => upd("sitemapEnabled", e.target.checked)} className="h-4 w-4" />
            Sitemap فعال باشد
          </label>
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
            <input type="checkbox" checked={settings.structuredDataEnabled} onChange={(e) => upd("structuredDataEnabled", e.target.checked)} className="h-4 w-4" />
            داده‌های ساختاری (Schema.org) فعال باشد
          </label>
        </div>
      )}

      {activeSection === "og" && (
        <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Open Graph</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>OG Image URL<input className={inp} style={inpStyle} value={settings.ogImageDefault} onChange={(e) => upd("ogImageDefault", e.target.value)} placeholder="/images/og-default.jpg" dir="ltr" /></label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>OG Site Name<input className={inp} style={inpStyle} value={settings.ogSiteName} onChange={(e) => upd("ogSiteName", e.target.value)} placeholder="Medalino" dir="ltr" /></label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>OG Type پیش‌فرض
              <select className={inp} style={inpStyle} value={settings.ogTypeDefault} onChange={(e) => upd("ogTypeDefault", e.target.value)} dir="ltr">
                <option value="website">website</option>
                <option value="article">article</option>
                <option value="product">product</option>
                <option value="profile">profile</option>
              </select>
            </label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Facebook App ID<input className={inp} style={inpStyle} value={settings.fbAppId} onChange={(e) => upd("fbAppId", e.target.value)} placeholder="1234567890" dir="ltr" /></label>
          </div>
        </div>
      )}

      {activeSection === "twitter" && (
        <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Twitter / X Cards</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>نوع کارت
              <select className={inp} style={inpStyle} value={settings.twitterCardType} onChange={(e) => upd("twitterCardType", e.target.value)} dir="ltr">
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Twitter Site<input className={inp} style={inpStyle} value={settings.twitterSite} onChange={(e) => upd("twitterSite", e.target.value)} placeholder="@medalino" dir="ltr" /></label>
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Twitter Creator<input className={inp} style={inpStyle} value={settings.twitterCreator} onChange={(e) => upd("twitterCreator", e.target.value)} placeholder="@medalino" dir="ltr" /></label>
          </div>
        </div>
      )}

      {activeSection === "perf" && (
        <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>عملکرد و امنیت</h3>
          <div className="flex flex-wrap gap-4">
            {([["enableLazyLoading", "Lazy Loading"], ["enablePreload", "Preload"], ["enablePrefetch", "Prefetch"], ["enableHttpsRedirect", "HTTPS Redirect"], ["enableSecurityHeaders", "Security Headers"]] as [keyof SeoSettings, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
                <input type="checkbox" checked={settings[key] as boolean} onChange={(e) => upd(key, e.target.checked)} className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
            HSTS Max Age (ثانیه)
            <input type="number" className={inp} style={inpStyle} value={settings.hstsMaxAge} onChange={(e) => upd("hstsMaxAge", parseInt(e.target.value) || 0)} dir="ltr" />
          </label>
        </div>
      )}

      {activeSection === "llms" && (
        <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>LLMs.txt</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>فایل llms.txt به هوش مصنوعی‌ها اطلاعات سایت شما را معرفی می‌کند.</p>
          <textarea className="w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.llmsTxt} onChange={(e) => upd("llmsTxt", e.target.value)} rows={10} dir="ltr" placeholder="# Medalino&#10;Online health and wellness store." />
        </div>
      )}

      <Btn onClick={() => void save()} disabled={saving}>
        {saving ? "در حال ذخیره…" : "ذخیرهٔ تنظیمات سئو"}
      </Btn>
    </div>
  );
}

// ─── Sitemap Tab ─────────────────────────────────────────────────────────────
function SitemapTab() {
  const [urls, setUrls] = useState<SitemapUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawXml, setRawXml] = useState("");
  const [message, setMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seo/sitemap");
      const text = await res.text();
      setRawXml(text);
      const blocks = text.match(/<url>[\s\S]*?<\/url>/g) ?? [];
      setUrls(blocks.map((b) => ({
        loc: b.match(/<loc>([^<]*)<\/loc>/)?.[1] ?? "",
        lastmod: b.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1] ?? "",
        changefreq: b.match(/<changefreq>([^<]*)<\/changefreq>/)?.[1] ?? "",
        priority: b.match(/<priority>([^<]*)<\/priority>/)?.[1] ?? "",
      })));
    } catch { setMessage("خطا در بارگذاری sitemap"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setHydrated(true); void load(); }, [load]);

  if (loading) return <p className="p-8" style={{ color: "var(--text-muted)" }}>در حال بارگذاری…</p>;

  return (
    <div className="flex flex-col gap-6">
      {message && <div className="rounded-md border p-3 text-sm" style={{ borderColor: message.includes("کپی") ? "#22c55e" : "#ef4444", background: message.includes("کپی") ? "#f0fdf4" : "#fef2f2", color: message.includes("کپی") ? "#16a34a" : "#dc2626" }}>{message}</div>}

      <div className="rounded-md border p-4" style={card}>
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>نقشه سایت (Sitemap)</h3>
          <div className="flex items-center gap-2">
            <span className="rounded px-2 py-1 text-xs font-mono" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>{urls.length} آدرس</span>
            <Btn variant="outline" onClick={() => void load()}>↻ بازخوانی</Btn>
          </div>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>نقشه سایت به‌صورت خودکار از محصولات منتشرشده تولید می‌شود.</p>

        <div className="mb-4 overflow-auto rounded-md border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                {["آدرس", "اولویت", "تغییر", "آخرین بروزرسانی"].map((h) => (
                  <th key={h} className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {urls.map((u, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr" style={{ color: "var(--text)" }}>{u.loc}</td>
                  <td className="px-3 py-2" style={{ color: "var(--text)" }}>{u.priority}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{u.changefreq}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {u.lastmod ? (hydrated ? new Date(u.lastmod).toLocaleDateString("fa-IR") : u.lastmod.slice(0, 10)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 flex-wrap">
          <a href="/api/seo/sitemap" target="_blank" rel="noopener noreferrer" className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--accent)" }}>مشاهده XML</a>
          <Btn variant="outline" onClick={() => { void navigator.clipboard.writeText(rawXml); setMessage("XML در کلیپ‌بورد کپی شد"); }}>کپی XML</Btn>
        </div>
      </div>

      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>راهنمای Sitemap</h3>
        <ul className="list-inside list-disc text-sm flex flex-col gap-1" style={{ color: "var(--text-muted)" }}>
          <li>آدرس sitemap: <code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>/sitemap.xml</code></li>
          <li>شامل تمام محصولات منتشرشده و صفحات اصلی</li>
          <li>پس از انتشار محصول جدید، sitemap خودکار بروزرسانی می‌شود</li>
          <li>در Google Search Console آدرس sitemap را ثبت کنید</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Robots Tab ──────────────────────────────────────────────────────────────
function RobotsTab({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load fresh content from API (don't rely on prop which may be empty on first render)
  useEffect(() => {
    void fetch("/api/settings/seo").then((r) => r.json()).then((j) => {
      if (j.ok && j.settings?.robotsTxt) setContent(j.settings.robotsTxt);
      else if (initialContent) setContent(initialContent);
    }).catch(() => { if (initialContent) setContent(initialContent); });
  }, [initialContent]);

  useEffect(() => {
    if (!content) return;
    void fetch("/api/seo/robots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) })
      .then((r) => r.json()).then((j) => { if (j.ok) setIssues(j.issues ?? []); }).catch(() => null);
  }, [content]);

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/settings/seo", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: { robotsTxt: content } }) });
      const j = await res.json();
      setMessage(j.ok ? "✓ robots.txt ذخیره شد." : j.message ?? "خطا");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setSaving(false); }
  };

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warnCount = issues.filter((i) => i.level === "warning").length;

  const DEFAULT_ROBOTS = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_astro/\nDisallow: /cdn-cgi/\n\nSitemap: https://medalino.ir/sitemap.xml`;

  return (
    <div className="flex flex-col gap-6">
      {message && <div className="rounded-md border p-3 text-sm" style={{ borderColor: message.startsWith("✓") ? "#22c55e" : "#ef4444", background: message.startsWith("✓") ? "#f0fdf4" : "#fef2f2", color: message.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{message}</div>}

      <div className="rounded-md border p-4" style={card}>
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>ویرایش robots.txt</h3>
          <div className="flex gap-2">
            {errorCount > 0 && <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">{errorCount} خطا</span>}
            {warnCount > 0 && <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">{warnCount} هشدار</span>}
            {errorCount === 0 && warnCount === 0 && content && <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">معتبر</span>}
          </div>
        </div>
        <textarea className="w-full rounded-md border p-3 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={content} onChange={(e) => setContent(e.target.value)} rows={12} dir="ltr" />
        <div className="mt-3 flex gap-2 flex-wrap">
          <Btn onClick={() => void save()} disabled={saving}>{saving ? "در حال ذخیره…" : "ذخیره robots.txt"}</Btn>
          <Btn variant="outline" onClick={() => setContent(DEFAULT_ROBOTS)}>بازنشانی پیش‌فرض</Btn>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="rounded-md border p-4" style={card}>
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>نتایج اعتبارسنجی</h3>
          <ul className="flex flex-col gap-2">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 rounded-md border p-2 text-sm" style={{ borderColor: issue.level === "error" ? "#ef4444" : issue.level === "warning" ? "#f59e0b" : "var(--border)", background: "var(--surface)" }}>
                <Badge level={issue.level} />
                {issue.line > 0 && <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }}>خط {issue.line}:</span>}
                <span style={{ color: "var(--text)" }}>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>راهنمای robots.txt</h3>
        <ul className="list-inside list-disc text-sm flex flex-col gap-1" style={{ color: "var(--text-muted)" }}>
          <li><code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>User-agent: *</code> — اعمال به همه ربات‌ها</li>
          <li><code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>Disallow</code> — مسیرهای مسدود</li>
          <li><code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>Sitemap</code> — آدرس نقشه سایت</li>
          <li>هر تغییر بلافاصله در فایل public/robots.txt فروشگاه اعمال می‌شود</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Indexing Tab ────────────────────────────────────────────────────────────
function IndexingTab() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [notifType, setNotifType] = useState<"URL_UPDATED" | "URL_DELETED">("URL_UPDATED");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; results?: { url: string; ok: boolean; message: string }[] } | null>(null);

  const submitSingle = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/indexing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      setResult(await res.json());
    } catch (e) { setResult({ ok: false, message: e instanceof Error ? e.message : "خطا" }); }
    finally { setLoading(false); }
  };

  const submitBulk = async () => {
    setLoading(true); setResult(null);
    const urls = bulkUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/indexing/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls, type: notifType }) });
      setResult(await res.json());
    } catch (e) { setResult({ ok: false, message: e instanceof Error ? e.message : "خطا" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>ارسال URL به Google Indexing API</h3>
        <div className="mb-4 flex gap-2">
          <Btn variant={mode === "single" ? "primary" : "outline"} onClick={() => setMode("single")}>تک URL</Btn>
          <Btn variant={mode === "bulk" ? "primary" : "outline"} onClick={() => setMode("bulk")}>دسته‌جمعی</Btn>
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>نوع اعلان
            <select className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={notifType} onChange={(e) => setNotifType(e.target.value as "URL_UPDATED" | "URL_DELETED")} dir="ltr">
              <option value="URL_UPDATED">URL_UPDATED — بروزرسانی / ایندکس</option>
              <option value="URL_DELETED">URL_DELETED — حذف از ایندکس</option>
            </select>
          </label>
        </div>

        {mode === "single" ? (
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
            آدرس URL
            <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://medalino.ir/products/..." dir="ltr" />
          </label>
        ) : (
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
            آدرس‌ها (هر خط یک URL — حداکثر ۱۰۰)
            <textarea className="mt-1 w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} rows={8} dir="ltr" placeholder={"https://medalino.ir/products/product-1\nhttps://medalino.ir/products/product-2"} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{bulkUrls.split("\n").filter((u) => u.trim()).length} آدرس وارد شده</span>
          </label>
        )}

        <div className="mt-4">
          <Btn onClick={() => void (mode === "single" ? submitSingle() : submitBulk())} disabled={loading || (mode === "single" ? !url.trim() : !bulkUrls.trim())}>
            {loading ? "در حال ارسال…" : "ارسال به Google"}
          </Btn>
        </div>
      </div>

      {result && (
        <div className="rounded-md border p-4 flex flex-col gap-3" style={{ borderColor: result.ok ? "#22c55e" : "#f59e0b", background: "var(--bg-elevated)" }}>
          <p className="font-semibold text-sm" style={{ color: result.ok ? "#16a34a" : "var(--text)" }}>{result.message}</p>
          {result.results && (
            <ul className="flex flex-col gap-1 max-h-60 overflow-auto">
              {result.results.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text)" }}>
                  <span style={{ color: r.ok ? "#22c55e" : "#ef4444" }}>{r.ok ? "✓" : "✗"}</span>
                  <span dir="ltr" className="font-mono">{r.url}</span>
                  {!r.ok && <span style={{ color: "#ef4444" }}>— {r.message}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-2 font-semibold" style={{ color: "var(--text)" }}>پیش‌نیاز</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>برای استفاده از Google Indexing API، متغیرهای محیطی زیر را در فایل <code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>.env</code> تنظیم کنید:</p>
        <pre className="mt-2 rounded-md p-3 text-xs font-mono overflow-auto" style={{ background: "var(--surface)", color: "var(--text)" }}>{`GOOGLE_INDEXING_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com\nGOOGLE_INDEXING_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."`}</pre>
      </div>
    </div>
  );
}

// ─── Audit Tab ───────────────────────────────────────────────────────────────
function AuditTab() {
  const [customPages, setCustomPages] = useState(QUICK_PAGES.map((p) => ({ ...p, custom: false })));
  const [newLabel, setNewLabel] = useState("");
  const [newPath, setNewPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ page: string; path: string; status: string; issues: string[]; score: number }[]>([]);

  const addPage = () => {
    if (!newPath.trim()) return;
    setCustomPages((p) => [...p, { label: newLabel || newPath, path: newPath.trim(), custom: true }]);
    setNewLabel(""); setNewPath("");
  };

  const removePage = (idx: number) => setCustomPages((p) => p.filter((_, i) => i !== idx));

  const audit = async () => {
    setLoading(true); setResults([]);
    const out: typeof results = [];

    for (const page of customPages) {
      try {
        const url = `${STOREFRONT_URL}${page.path}`;
        const res = await fetch("/api/seo/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
        const j = await res.json();
        const issues: string[] = [];

        if (j.ok && j.html) {
          const html = j.html as string;
          const title = extractTitleFromHtml(html);
          const desc = extractMetaDescriptionFromHtml(html);
          const canonical = extractCanonicalFromHtml(html);
          const { missing: imgMissing, total: totalImages } = countImgWithoutAlt(html);

          if (!title) issues.push("بدون title tag");
          else if (title.length < 30) issues.push(`عنوان کوتاه (${title.length} کاراکتر)`);
          else if (title.length > 60) issues.push(`عنوان بلند (${title.length} کاراکتر)`);

          if (!desc) issues.push("بدون meta description");
          else if (desc.length < 100) issues.push(`توضیحات کوتاه (${desc.length} کاراکتر)`);

          if (!canonical) issues.push("بدون canonical link");
          if (imgMissing > 0) issues.push(`${imgMissing}/${totalImages} تصویر بدون alt`);
        } else {
          issues.push(j.error ?? j.message ?? "خطا در دریافت صفحه");
        }

        const score = Math.max(0, 100 - issues.length * 20);
        out.push({ page: page.label, path: page.path, status: issues.length === 0 ? "ok" : issues.length <= 2 ? "warning" : "error", issues, score });
      } catch {
        out.push({ page: page.label, path: page.path, status: "error", issues: ["خطا در اتصال"], score: 0 });
      }
    }

    setResults(out); setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>بررسی سریع صفحات</h3>

        {/* Page list */}
        <div className="mb-4 flex flex-col gap-2">
          {customPages.map((p, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={surface}>
              <span className="flex-1 font-medium" style={{ color: "var(--text)" }}>{p.label}</span>
              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }} dir="ltr">{p.path}</span>
              {p.custom && <button type="button" onClick={() => removePage(i)} className="text-xs" style={{ color: "#ef4444" }}>✕</button>}
            </div>
          ))}
        </div>

        {/* Add custom page */}
        <div className="flex gap-2 flex-wrap mb-4">
          <input className="rounded-md border p-2 text-sm flex-1 min-w-32" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="نام صفحه" />
          <input className="rounded-md border p-2 text-sm flex-1 min-w-40" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/products/my-product" dir="ltr" />
          <Btn variant="outline" onClick={addPage} disabled={!newPath.trim()}>+ افزودن</Btn>
        </div>

        <Btn onClick={() => void audit()} disabled={loading || customPages.length === 0}>
          {loading ? "در حال بررسی…" : `شروع بررسی (${customPages.length} صفحه)`}
        </Btn>
      </div>

      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "سالم", count: results.filter((r) => r.status === "ok").length, color: "#22c55e" },
              { label: "هشدار", count: results.filter((r) => r.status === "warning").length, color: "#f59e0b" },
              { label: "مشکل‌دار", count: results.filter((r) => r.status === "error").length, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border p-3 text-center" style={card}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {results.map((r) => (
              <div key={r.path} className="rounded-md border p-4" style={{ borderColor: r.status === "ok" ? "#22c55e" : r.status === "warning" ? "#f59e0b" : "#ef4444", background: "var(--bg-elevated)" }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text)" }}>{r.page}</span>
                    <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }} dir="ltr">{r.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: r.score >= 80 ? "#22c55e" : r.score >= 50 ? "#f59e0b" : "#ef4444" }}>{r.score}/100</span>
                    <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: r.status === "ok" ? "#22c55e" : r.status === "warning" ? "#f59e0b" : "#ef4444" }}>
                      {r.status === "ok" ? "سالم" : r.status === "warning" ? "هشدار" : "مشکل‌دار"}
                    </span>
                  </div>
                </div>
                {r.issues.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {r.issues.map((issue, i) => <li key={i} className="text-sm" style={{ color: "var(--text-muted)" }}>• {issue}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── WebP Converter Tab ──────────────────────────────────────────────────────
type ImageInfo = {
  relativePath: string;
  ext: string;
  sizeBytes: number;
  isWebp: boolean;
  webpExists: boolean;
  webpSizeBytes: number | null;
};

type ConvertStrategy = "alongside" | "webp-only" | "replace";

type ConvertResult = {
  file: string;
  outputFile: string;
  ok: boolean;
  originalSize: number;
  webpSize: number | null;
  saving: number | null;
  savingPct: number | null;
  referencesUpdated: string[];
  error?: string;
};

type ConvertSummary = {
  total: number;
  success: number;
  failed: number;
  totalOriginalBytes: number;
  totalWebpBytes: number;
  totalSavingBytes: number;
  totalSavingPct: number;
};

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function WebpTab() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [convertingFile, setConvertingFile] = useState<string | null>(null);
  const [quality, setQuality] = useState(82);
  const [strategy, setStrategy] = useState<ConvertStrategy>("webp-only");
  const [results, setResults] = useState<ConvertResult[]>([]);
  const [summary, setSummary] = useState<ConvertSummary | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seo/webp-convert");
      const j = await res.json();
      if (j.ok) setImages(j.images ?? []);
      else setMessage(j.error ?? "خطا در بارگذاری");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadImages(); }, [loadImages]);

  const convertAll = async () => {
    setConverting(true); setResults([]); setSummary(null); setMessage("");
    try {
      const res = await fetch("/api/seo/webp-convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "all", quality, strategy }),
      });
      const j = await res.json();
      if (j.ok) {
        setResults(j.results ?? []);
        setSummary(j.summary ?? null);
        setMessage(j.message ?? "");
        await loadImages();
      } else setMessage(j.error ?? "خطا");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setConverting(false); }
  };

  const convertSingle = async (filePath: string) => {
    setConvertingFile(filePath);
    try {
      const res = await fetch("/api/seo/webp-convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "single", filePath, quality, strategy }),
      });
      const j = await res.json();
      if (j.ok && j.results?.length) {
        setResults((prev) => {
          const next = [...prev];
          const idx = next.findIndex((r) => r.file === filePath);
          if (idx >= 0) next[idx] = j.results[0];
          else next.push(j.results[0]);
          return next;
        });
        await loadImages();
      } else setMessage(j.error ?? "خطا");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setConvertingFile(null); }
  };

  const [cleaning, setCleaning] = useState(false);

  const nonWebpImages = images.filter((img) => !img.isWebp);
  // "pending" depends on strategy: for alongside = no .webp yet; for replace/webp-only = all originals
  const pendingImages = strategy === "alongside"
    ? nonWebpImages.filter((img) => !img.webpExists)
    : nonWebpImages;
  const doneImages = strategy === "alongside"
    ? nonWebpImages.filter((img) => img.webpExists)
    : [];

  const filteredImages = filter === "pending"
    ? (strategy === "alongside" ? pendingImages : nonWebpImages.filter((img) => !results.find((r) => r.file === img.relativePath)?.ok))
    : filter === "done"
    ? (strategy === "alongside" ? doneImages : nonWebpImages.filter((img) => results.find((r) => r.file === img.relativePath)?.ok))
    : nonWebpImages;

  const hasOrphanWebp = images.some((img) => img.isWebp);

  const cleanupOrphanWebp = async () => {
    setCleaning(true); setMessage("");
    try {
      const res = await fetch("/api/seo/webp-convert", { method: "DELETE" });
      const j = await res.json();
      if (j.ok) {
        setMessage(`✓ ${j.count} فایل .webp اضافه پاک شد. حالا می‌توانید با روش دلخواه تبدیل کنید.`);
        setResults([]);
        setSummary(null);
        await loadImages();
      } else setMessage(j.error ?? "خطا در پاکسازی");
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطا"); }
    finally { setCleaning(false); }
  };

  if (loading) return <p className="p-8" style={{ color: "var(--text-muted)" }}>در حال بارگذاری تصاویر…</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "کل تصاویر", value: nonWebpImages.length, color: "var(--text)" },
          {
            label: strategy === "alongside" ? "تبدیل‌نشده" : "آماده برای تبدیل",
            value: pendingImages.length,
            color: pendingImages.length > 0 ? "#f59e0b" : "#22c55e",
          },
          {
            label: strategy === "alongside" ? "تبدیل‌شده" : "تبدیل‌شده (این جلسه)",
            value: strategy === "alongside" ? doneImages.length : results.filter((r) => r.ok).length,
            color: "#22c55e",
          },
          {
            label: "صرفه‌جویی کل",
            value: summary ? `${summary.totalSavingPct}%` : "—",
            color: "#3b82f6",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-md border p-4" style={card}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {message && (
        <div className="rounded-md border p-3 text-sm" style={{ borderColor: message.startsWith("✓") ? "#22c55e" : "var(--border)", background: message.startsWith("✓") ? "#f0fdf4" : "var(--surface)", color: message.startsWith("✓") ? "#16a34a" : "var(--text)" }}>{message}</div>
      )}

      {/* Orphan WebP warning */}
      {hasOrphanWebp && (
        <div className="rounded-md border p-4 flex items-start gap-3" style={{ borderColor: "#f59e0b", background: "#fffbeb" }}>
          <span className="text-xl shrink-0">⚠</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "#92400e" }}>
              {images.filter((img) => img.isWebp).length} فایل .webp کنار فایل‌های اصلی وجود دارد
            </p>
            <p className="text-xs mt-1" style={{ color: "#92400e" }}>
              این فایل‌ها از تبدیل قبلی باقی مانده‌اند. برای اجرای روش «جایگزین کامل» یا «جایگزین شفاف»، ابتدا آن‌ها را پاک کنید.
            </p>
            <div className="mt-2">
              <Btn variant="outline" onClick={() => void cleanupOrphanWebp()} disabled={cleaning}>
                {cleaning ? "در حال پاکسازی…" : `🗑 پاک کردن ${images.filter((img) => img.isWebp).length} فایل .webp اضافه`}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="rounded-md border p-4 flex flex-col gap-4" style={card}>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>تنظیمات تبدیل</h3>

        {/* Strategy selector */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>روش جایگزینی:</p>
          <div className="flex flex-col gap-2">
            {([
              { val: "webp-only" as ConvertStrategy, title: "جایگزین کامل (توصیه‌شده)", desc: "فایل .webp ذخیره می‌شود، فایل اصلی حذف و تمام ارجاعات در کد به .webp آپدیت می‌شوند" },
              { val: "replace" as ConvertStrategy, title: "جایگزین شفاف", desc: "محتوای WebP در همان فایل اصلی نوشته می‌شود (hero.jpg همچنان hero.jpg است اما داده WebP دارد) — بدون نیاز به تغییر کد" },
              { val: "alongside" as ConvertStrategy, title: "کنار هم", desc: "فایل .webp کنار فایل اصلی ذخیره می‌شود، هیچ فایلی حذف نمی‌شود" },
            ] as { val: ConvertStrategy; title: string; desc: string }[]).map((opt) => (
              <label key={opt.val} className="flex items-start gap-3 cursor-pointer rounded-md border p-3 transition" style={{ borderColor: strategy === opt.val ? "var(--accent)" : "var(--border)", background: strategy === opt.val ? "var(--surface)" : "transparent" }}>
                <input type="radio" name="strategy" value={opt.val} checked={strategy === opt.val} onChange={() => setStrategy(opt.val)} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{opt.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quality slider */}
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--text)" }}>
          کیفیت WebP: <strong>{quality}%</strong>
          <input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-48" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {quality >= 90 ? "کیفیت بالا (حجم بیشتر)" : quality >= 75 ? "تعادل مناسب" : "حجم کم (کیفیت پایین‌تر)"}
          </span>
        </label>

        {/* Warning for destructive strategies */}
        {(strategy === "webp-only" || strategy === "replace") && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: "#f59e0b", background: "#fffbeb", color: "#92400e" }}>
            ⚠ این عملیات برگشت‌پذیر نیست. قبل از اجرا از وجود backup مطمئن شوید.
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => void convertAll()} disabled={converting || nonWebpImages.length === 0}>
            {converting ? "در حال تبدیل…" : `تبدیل ${strategy === "alongside" ? `${pendingImages.length} تصویر باقی‌مانده` : `همه ${nonWebpImages.length} تصویر`}`}
          </Btn>
          <Btn variant="outline" onClick={() => void loadImages()}>↻ بازخوانی</Btn>
        </div>
      </div>

      {/* Conversion summary */}
      {summary && (
        <div className="rounded-md border p-4" style={{ borderColor: "#22c55e", background: "#f0fdf4" }}>
          <h3 className="mb-3 font-semibold" style={{ color: "#16a34a" }}>نتیجه تبدیل دسته‌جمعی</h3>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div><span style={{ color: "#16a34a" }}>✓ موفق:</span> <strong>{summary.success}</strong> تصویر</div>
            {summary.failed > 0 && <div><span style={{ color: "#ef4444" }}>✗ ناموفق:</span> <strong>{summary.failed}</strong> تصویر</div>}
            <div><span style={{ color: "#16a34a" }}>حجم اصلی:</span> <strong>{fmtBytes(summary.totalOriginalBytes)}</strong></div>
            <div><span style={{ color: "#16a34a" }}>حجم WebP:</span> <strong>{fmtBytes(summary.totalWebpBytes)}</strong></div>
            <div><span style={{ color: "#16a34a" }}>صرفه‌جویی:</span> <strong>{fmtBytes(summary.totalSavingBytes)} ({summary.totalSavingPct}%)</strong></div>
          </div>
        </div>
      )}

      {/* Image list */}
      <div className="rounded-md border p-4" style={card}>
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>لیست تصاویر</h3>
          <div className="flex gap-1">
            {(["all", "pending", "done"] as const).map((f) => {
              const counts = {
                all: nonWebpImages.length,
                pending: strategy === "alongside" ? pendingImages.length : nonWebpImages.filter((img) => !results.find((r) => r.file === img.relativePath)?.ok).length,
                done: strategy === "alongside" ? doneImages.length : results.filter((r) => r.ok).length,
              };
              return (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className="rounded px-3 py-1 text-xs font-medium transition"
                  style={{ background: filter === f ? "var(--accent)" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)" }}>
                  {f === "all" ? `همه (${counts.all})` : f === "pending" ? `در انتظار (${counts.pending})` : `تبدیل‌شده (${counts.done})`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-auto rounded-md border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>فایل</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>نوع</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>حجم اصلی</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>حجم WebP</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>صرفه‌جویی</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>وضعیت</th>
                <th className="px-3 py-2 text-start" style={{ color: "var(--text)" }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredImages.map((img) => {
                const result = results.find((r) => r.file === img.relativePath);
                const isConverting = convertingFile === img.relativePath;
                const webpSize = result?.webpSize ?? (strategy === "alongside" ? img.webpSizeBytes : null);
                const saving = webpSize ? img.sizeBytes - webpSize : null;
                const savingPct = saving && img.sizeBytes > 0 ? Math.round((saving / img.sizeBytes) * 100) : null;
                // "done" only if we actually ran conversion this session, OR alongside mode with existing webp
                const isDone = result?.ok || (strategy === "alongside" && img.webpExists);

                return (
                  <tr key={img.relativePath} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 font-mono text-xs max-w-48 truncate" dir="ltr" style={{ color: "var(--text)" }} title={img.relativePath}>{img.relativePath}</td>
                    <td className="px-3 py-2 uppercase text-xs font-bold" style={{ color: "var(--text-muted)" }}>{img.ext.replace(".", "")}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{fmtBytes(img.sizeBytes)}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: webpSize ? "#22c55e" : "var(--text-muted)" }}>{webpSize ? fmtBytes(webpSize) : "—"}</td>
                    <td className="px-3 py-2 text-xs font-bold" style={{ color: savingPct && savingPct > 0 ? "#22c55e" : savingPct && savingPct < 0 ? "#ef4444" : "var(--text-muted)" }}>
                      {savingPct !== null ? `${savingPct > 0 ? "-" : "+"}${Math.abs(savingPct)}%` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {isDone ? (
                        <div className="flex flex-col gap-1">
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ تبدیل‌شده</span>
                          {result?.referencesUpdated && result.referencesUpdated.length > 0 && (
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700" title={result.referencesUpdated.join(", ")}>
                              {result.referencesUpdated.length} فایل آپدیت
                            </span>
                          )}
                        </div>
                      ) : result && !result.ok ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700" title={result.error}>✗ خطا</span>
                      ) : (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">در انتظار</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {!isDone && !result?.ok && (
                        <button type="button" onClick={() => void convertSingle(img.relativePath)} disabled={isConverting || converting}
                          className="rounded px-2 py-1 text-xs font-medium text-white transition"
                          style={{ background: "var(--accent)", opacity: isConverting || converting ? 0.5 : 1 }}>
                          {isConverting ? "…" : "تبدیل"}
                        </button>
                      )}
                      {isDone && !result && strategy !== "alongside" && (
                        <button type="button" onClick={() => void convertSingle(img.relativePath)} disabled={isConverting || converting}
                          className="rounded px-2 py-1 text-xs font-medium transition"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", opacity: isConverting || converting ? 0.5 : 1 }}>
                          {isConverting ? "…" : "اجرا مجدد"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-md border p-4" style={card}>
        <h3 className="mb-2 font-semibold" style={{ color: "var(--text)" }}>راهنمای روش‌های تبدیل</h3>
        <ul className="list-inside list-disc text-sm flex flex-col gap-1.5" style={{ color: "var(--text-muted)" }}>
          <li><strong style={{ color: "var(--text)" }}>جایگزین کامل:</strong> فایل .webp ذخیره، فایل اصلی حذف، و تمام ارجاعات در products.json، posts.json، homepage-blocks.json و index.astro به .webp تغییر می‌کنند</li>
          <li><strong style={{ color: "var(--text)" }}>جایگزین شفاف:</strong> محتوای WebP در همان فایل اصلی نوشته می‌شود — هیچ تغییری در کد لازم نیست، مرورگر WebP را سرو می‌کند</li>
          <li><strong style={{ color: "var(--text)" }}>کنار هم:</strong> هر دو فایل حفظ می‌شوند — مناسب برای استفاده با تگ <code className="rounded px-1 text-xs" style={{ background: "var(--surface)" }}>&lt;picture&gt;</code></li>
          <li>کیفیت ۸۰–۸۵ برای اکثر تصاویر تعادل مناسبی بین کیفیت و حجم ایجاد می‌کند</li>
        </ul>
      </div>
    </div>
  );
}
