import fs from "node:fs";
import path from "node:path";

const SETTINGS_FILE = path.join(process.cwd(), ".data", "site-settings.json");

export type ThemeMode = "dark" | "light" | "auto";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  geminiApiKey: string;
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
};

const DEFAULTS: SiteSettings = {
  siteName: "مدالینو",
  siteDescription: "عملیات، CRM و انتشار کمک‌شده با هوش مصنوعی",
  siteUrl: "https://medalino.ir",
  geminiApiKey: "",
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
