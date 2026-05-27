import fs from "node:fs";
import path from "node:path";

export type ProviderUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

export type UsageData = Record<string, ProviderUsage>;

const USAGE_FILE = path.join(process.cwd(), ".data", "ai-usage.json");

function ensureDir(): void {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadUsage(): UsageData {
  try {
    if (!fs.existsSync(USAGE_FILE)) return {};
    return JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveUsage(data: UsageData): void {
  ensureDir();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function trackUsage(
  provider: string,
  promptTokens: number,
  completionTokens: number,
): void {
  const data = loadUsage();
  const prev = data[provider] || { promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0 };
  data[provider] = {
    promptTokens: prev.promptTokens + promptTokens,
    completionTokens: prev.completionTokens + completionTokens,
    totalTokens: prev.totalTokens + promptTokens + completionTokens,
    requests: prev.requests + 1,
  };
  saveUsage(data);
}

export function getUsage(): UsageData {
  return loadUsage();
}

export function getTotalUsage(): ProviderUsage {
  const data = loadUsage();
  const totals: ProviderUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0 };
  for (const p of Object.values(data)) {
    totals.promptTokens += p.promptTokens;
    totals.completionTokens += p.completionTokens;
    totals.totalTokens += p.totalTokens;
    totals.requests += p.requests;
  }
  return totals;
}
