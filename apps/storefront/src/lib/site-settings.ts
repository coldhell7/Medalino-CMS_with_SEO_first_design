import fs from "node:fs";
import path from "node:path";

const SETTINGS_FILE = path.join(
  process.cwd(),
  "..",
  "..",
  "apps",
  "admin",
  ".data",
  "site-settings.json",
);

const SEO_FILE = path.join(
  process.cwd(),
  "..",
  "..",
  "apps",
  "admin",
  ".data",
  "seo-settings.json",
);

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  faviconDataUrl: string;
  theme: string;
  accentColor: string;
};

export type SeoSettings = {
  metaTitleTemplate: string;
  metaDescriptionTemplate: string;
  canonicalBaseUrl: string;
  ogImageDefault: string;
  sitemapEnabled: boolean;
  // New SEO settings
  structuredDataEnabled: boolean;
  twitterCardType: string;
  twitterSite: string;
  twitterCreator: string;
  ogTypeDefault: string;
  ogSiteName: string;
  fbAppId: string;
  // Performance settings
  enableLazyLoading: boolean;
  enablePreload: boolean;
  enablePrefetch: boolean;
  // Security settings
  enableHttpsRedirect: boolean;
  enableSecurityHeaders: boolean;
  hstsMaxAge: number;
};

const DEFAULTS: SiteSettings = {
  siteName: "مدالینو",
  siteDescription: "فروشگاه و مجله سلامت مدالینو",
  siteUrl: "https://medalino.ir",
  faviconDataUrl: "",
  theme: "dark",
  accentColor: "#38bdf8",
};

const SEO_DEFAULTS: SeoSettings = {
  metaTitleTemplate: "{title} | {siteName}",
  metaDescriptionTemplate: "{description}",
  canonicalBaseUrl: "https://medalino.ir",
  ogImageDefault: "/images/og-default.jpg",
  sitemapEnabled: true,
  // New SEO settings defaults
  structuredDataEnabled: true,
  twitterCardType: "summary_large_image",
  twitterSite: "@medalino",
  twitterCreator: "@medalino",
  ogTypeDefault: "website",
  ogSiteName: "Medalino",
  fbAppId: "",
  // Performance settings defaults
  enableLazyLoading: true,
  enablePreload: true,
  enablePrefetch: true,
  // Security settings defaults
  enableHttpsRedirect: true,
  enableSecurityHeaders: true,
  hstsMaxAge: 31536000, // 1 year
};

export function getSiteSettings(): SiteSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getSeoSettings(): SeoSettings {
  try {
    if (!fs.existsSync(SEO_FILE)) return { ...SEO_DEFAULTS };
    const raw = fs.readFileSync(SEO_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SeoSettings>;
    return { ...SEO_DEFAULTS, ...parsed };
  } catch {
    return { ...SEO_DEFAULTS };
  }
}

export function applyMetaTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}