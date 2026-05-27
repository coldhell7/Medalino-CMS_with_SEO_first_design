import fs from "node:fs";
import path from "node:path";

const SETTINGS_FILE = path.join(process.cwd(), ".data", "site-settings.json");

export type ThemeMode = "dark" | "light" | "auto";
export type AiProvider = "gemini" | "openrouter" | "deepseek";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
  openrouterBaseUrl: string;
  deepseekApiKey: string;
  defaultAiProvider: AiProvider;
  faviconDataUrl: string;
  theme: ThemeMode;
  accentColor: string;
  bgDark: string;
  bgElevatedDark: string;
  surfaceDark: string;
  textDark: string;
  textMutedDark: string;
  accentDark: string;
  bgLight: string;
  bgElevatedLight: string;
  surfaceLight: string;
  textLight: string;
  textMutedLight: string;
  accentLight: string;
  contentPrompt: string;
  productPrompt: string;
};

const DEFAULTS: SiteSettings = {
  siteName: "مدالینو",
  siteDescription: "عملیات، CRM و انتشار کمک‌شده با هوش مصنوعی",
  siteUrl: "https://medalino.ir",
  geminiApiKey: "",
  openrouterApiKey: "",
  openrouterModel: "deepseek/deepseek-chat",
  openrouterBaseUrl: "https://openrouter.ai",
  deepseekApiKey: "",
  defaultAiProvider: "deepseek",
  faviconDataUrl: "",
  theme: "dark",
  accentColor: "#38bdf8",
  bgDark: "#0b1220",
  bgElevatedDark: "#111827",
  surfaceDark: "#151f33",
  textDark: "#e5e7eb",
  textMutedDark: "#94a3b8",
  accentDark: "#38bdf8",
  bgLight: "#f8fafc",
  bgElevatedLight: "#ffffff",
  surfaceLight: "#ffffff",
  textLight: "#0f172a",
  textMutedLight: "#64748b",
  accentLight: "#0284c7",
  contentPrompt: `You are an SEO expert and content writer for a Persian (Farsi) website.
Analyze the existing content below and return SEO-optimized improvements as STRICT JSON.

Existing title:
{title}
{body}
{keywords}

Return STRICT JSON with these EXACT keys:
- slug: URL-friendly Latin slug based on title (lowercase, hyphens only, no spaces, no Persian chars)
- metaTitle: SEO-optimized title (max 60 chars, include primary keyword naturally)
- metaDescription: compelling meta description for search results (max 160 chars, include keyword and CTA)
- excerpt: short engaging summary of content (max 220 chars)
- body: improved HTML content with <p> and <h2>/<h3> tags, well-structured for readability

SEO rules:
- Primary keyword should appear in metaTitle, metaDescription, and early in body
- metaDescription should be clickable and include a call-to-action
- Use proper header hierarchy (h2 > h3)
- Keep paragraphs short (2-4 sentences max)
- All Persian text must be grammatically correct with proper spacing

Return ONLY valid JSON, no other text.`,
  productPrompt: `You are an SEO expert and ecommerce copywriter for a Persian (Farsi) online store.
Analyze the existing product content below and return SEO-optimized improvements as STRICT JSON.

Product title:
{title}
{body}
{keywords}

Return STRICT JSON with these EXACT keys:
- slug: URL-friendly Latin slug based on title (lowercase, hyphens only, no spaces, no Persian chars)
- metaTitle: SEO-optimized product title (max 60 chars, include primary keyword naturally)
- metaDescription: compelling meta description for search results (max 160 chars, include keyword and benefit)
- description: persuasive product description as HTML with <p> and <ul> tags (2-3 paragraphs, highlight features/benefits)
- workflowHint: brief note about the product's category or usage (string)

SEO rules:
- Primary keyword should appear in metaTitle, metaDescription, and early in description
- metaDescription should be clickable and highlight key benefit
- Use bullet points in description for features where appropriate
- Keep paragraphs short and persuasive
- All Persian text must be grammatically correct with proper spacing

Return ONLY valid JSON, no other text.`,
};

function ensureDir(): void {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSettings(): SiteSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings: Partial<SiteSettings>): void {
  ensureDir();
  const current = loadSettings();
  const merged = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");
}

export function getSiteSettings(): SiteSettings {
  return loadSettings();
}

export function updateSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
  saveSettings(updates);
  return loadSettings();
}

export function getEffectiveGeminiApiKey(): string | null {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.geminiApiKey?.trim() || null;
}

export function maskApiKey(key: string): string {
  const t = key.trim();
  if (t.length <= 8) return "••••••••";
  return `••••••••${t.slice(-4)}`;
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

export function readGeminiApiKeyFromFile(): string | null {
  const settings = loadSettings();
  return settings.geminiApiKey?.trim() || null;
}

export function writeGeminiApiKeyToFile(apiKey: string): void {
  saveSettings({ geminiApiKey: apiKey.trim() });
}

export function readOpenRouterApiKeyFromFile(): string | null {
  const settings = loadSettings();
  return settings.openrouterApiKey?.trim() || null;
}

export function writeOpenRouterApiKeyToFile(apiKey: string): void {
  saveSettings({ openrouterApiKey: apiKey.trim() });
}

export function getEffectiveOpenRouterApiKey(): string | null {
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.openrouterApiKey?.trim() || null;
}

export function getOpenRouterModel(): string {
  const fromEnv = process.env.OPENROUTER_MODEL?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.openrouterModel?.trim() || "deepseek/deepseek-chat";
}

export function getOpenRouterBaseUrl(): string {
  const fromEnv = process.env.OPENROUTER_BASE_URL?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.openrouterBaseUrl?.trim() || "https://openrouter.ai";
}

export function readDeepSeekApiKeyFromFile(): string | null {
  const settings = loadSettings();
  return settings.deepseekApiKey?.trim() || null;
}

export function writeDeepSeekApiKeyToFile(apiKey: string): void {
  saveSettings({ deepseekApiKey: apiKey.trim() });
}

export function getEffectiveDeepSeekApiKey(): string | null {
  const fromEnv = process.env.DEEPSEEK_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.deepseekApiKey?.trim() || null;
}

export function getContentPrompt(): string {
  const fromEnv = process.env.CONTENT_PROMPT?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.contentPrompt?.trim() || DEFAULTS.contentPrompt;
}

export function getProductPrompt(): string {
  const fromEnv = process.env.PRODUCT_PROMPT?.trim();
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings.productPrompt?.trim() || DEFAULTS.productPrompt;
}

export function getDefaultAiProvider(): AiProvider {
  const fromEnv = process.env.DEFAULT_AI_PROVIDER?.trim();
  if (fromEnv && ["gemini", "openrouter", "deepseek"].includes(fromEnv)) return fromEnv as AiProvider;
  const settings = loadSettings();
  if (["gemini", "openrouter", "deepseek"].includes(settings.defaultAiProvider)) return settings.defaultAiProvider;
  return "deepseek";
}
