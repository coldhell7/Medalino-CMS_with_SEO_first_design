"use client";

import { useEffect, useState, useCallback } from "react";
import { Surface } from "@repo/ui/react";

type SiteSettingsForm = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  theme: "dark" | "light" | "auto";
  accentColor: string;
  faviconDataUrl: string;
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
  openrouterModel: string;
  openrouterBaseUrl: string;
  defaultAiProvider: string;
};

type AiStatus = {
  source: string;
  configured: boolean;
  maskedKey: string | null;
};

type ConnectionState = "untested" | "testing" | "connected" | "failed";

type OpenRouterModel = { id: string; name: string };

type ProviderUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

const PROVIDERS = [
  { id: "gemini", label: "Google Gemini", placeholder: "AIza…" },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-v1-…" },
  { id: "deepseek", label: "DeepSeek (مستقیم)", placeholder: "sk-…" },
] as const;

const COLOR_FIELDS = {
  dark: [
    { key: "bgDark", label: "پس‌زمینه" },
    { key: "bgElevatedDark", label: "پس‌زمینه بالا" },
    { key: "surfaceDark", label: "سطح" },
    { key: "textDark", label: "متن" },
    { key: "textMutedDark", label: "متن کم‌رنگ" },
    { key: "accentDark", label: "تأکید" },
  ],
  light: [
    { key: "bgLight", label: "پس‌زمینه" },
    { key: "bgElevatedLight", label: "پس‌زمینه بالا" },
    { key: "surfaceLight", label: "سطح" },
    { key: "textLight", label: "متن" },
    { key: "textMutedLight", label: "متن کم‌رنگ" },
    { key: "accentLight", label: "تأکید" },
  ],
} as const;

const TABS = [
  { id: "general" as const, label: "عمومی" },
  { id: "ai" as const, label: "هوش مصنوعی" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "ai">("general");

  const [settings, setSettings] = useState<SiteSettingsForm>({
    siteName: "",
    siteDescription: "",
    siteUrl: "",
    theme: "dark",
    accentColor: "#38bdf8",
    faviconDataUrl: "",
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
    openrouterModel: "deepseek/deepseek-chat",
    openrouterBaseUrl: "https://openrouter.ai",
    defaultAiProvider: "deepseek",
  });

  const [contentPrompt, setContentPrompt] = useState("");
  const [productPrompt, setProductPrompt] = useState("");
  const [savingPrompts, setSavingPrompts] = useState(false);

  const [tokenUsage, setTokenUsage] = useState<Record<string, ProviderUsage>>({});
  const [usageTotals, setUsageTotals] = useState<ProviderUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");

  const [selectedProvider, setSelectedProvider] = useState("deepseek");
  const [tokenInput, setTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [clientTesting, setClientTesting] = useState(false);
  const [clientTestResult, setClientTestResult] = useState<string | null>(null);

  const [geminiStatus, setGeminiStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });
  const [openrouterStatus, setOpenrouterStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });
  const [deepseekStatus, setDeepseekStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });

  const [aiConnections, setAiConnections] = useState<Record<string, ConnectionState>>({
    gemini: "untested",
    openrouter: "untested",
    deepseek: "untested",
  });

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  const providerStatus = (() => {
    if (selectedProvider === "gemini") return geminiStatus;
    if (selectedProvider === "openrouter") return openrouterStatus;
    return deepseekStatus;
  })();

  const currentPlaceholder = PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder ?? "توکن API";

  const checkConnection = useCallback(async (provider: string) => {
    setAiConnections(prev => ({ ...prev, [provider]: "testing" }));
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await res.json();
      setAiConnections(prev => ({ ...prev, [provider]: j.ok ? "connected" : "failed" }));
    } catch {
      setAiConnections(prev => ({ ...prev, [provider]: "failed" }));
    }
  }, []);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/settings/ai/models");
      const j = await res.json();
      if (j.ok && Array.isArray(j.models)) setModels(j.models);
    } catch {
      // ignore
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/settings/ai/usage");
      const j = await res.json();
      if (j.ok) {
        setTokenUsage(j.usage || {});
        setUsageTotals(j.totals || null);
      }
    } catch {
      // ignore
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok) {
          setSettings((prev) => ({ ...prev, ...j.settings }));
          setGeminiStatus(j.gemini);
          setOpenrouterStatus(j.openrouter || { source: "none", configured: false, maskedKey: null });
          setDeepseekStatus(j.deepseek || { source: "none", configured: false, maskedKey: null });
          if (j.settings?.defaultAiProvider) setSelectedProvider(j.settings.defaultAiProvider);
          if (j.settings?.openrouterModel) setSelectedModel(j.settings.openrouterModel);
          if (j.settings?.contentPrompt) setContentPrompt(j.settings.contentPrompt);
          if (j.settings?.productPrompt) setProductPrompt(j.settings.productPrompt);
        }
      } catch {
        setMessage("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const configured = [
      { id: "gemini", status: geminiStatus },
      { id: "openrouter", status: openrouterStatus },
      { id: "deepseek", status: deepseekStatus },
    ].filter(p => p.status.configured);
    configured.forEach(({ id }) => void checkConnection(id));
    if (openrouterStatus.configured) void fetchModels();
  }, [loading, geminiStatus.configured, openrouterStatus.configured, deepseekStatus.configured, checkConnection, fetchModels]);

  const saveToken = async () => {
    const t = tokenInput.trim();
    if (!t) return;
    setSavingToken(true);
    setMessage("");
    setTestResult(null);
    try {
      const endpoint = selectedProvider === "gemini"
        ? "/api/settings/gemini"
        : selectedProvider === "openrouter"
          ? "/api/settings/openrouter"
          : "/api/settings/deepseek";

      const body = JSON.stringify({ apiKey: t });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      const j = await res.json();
      if (j.ok) {
        setMessage(`توکن ${PROVIDERS.find((p) => p.id === selectedProvider)?.label} ذخیره شد.`);
        setTokenInput("");
        await fetch("/api/settings/site", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ defaultAiProvider: selectedProvider }),
        });
        const check = await fetch("/api/settings/site");
        const st = await check.json();
        if (st.ok) {
          setSettings((prev) => ({ ...prev, ...st.settings }));
          setGeminiStatus(st.gemini);
          setOpenrouterStatus(st.openrouter || { source: "none", configured: false, maskedKey: null });
          setDeepseekStatus(st.deepseek || { source: "none", configured: false, maskedKey: null });
        }
        if (selectedProvider === "openrouter") void fetchModels();
        void checkConnection(selectedProvider);
      } else {
        setMessage(j.message ?? "خطا در ذخیره توکن");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSavingToken(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      });
      const j = await res.json();
      if (j.ok) {
        setTestResult(j.message);
        if (selectedProvider === "openrouter") void fetchModels();
      } else setTestResult(j.message || "خطا در تست اتصال");
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "خطا");
    } finally {
      setTesting(false);
    }
  };

  const testDirectConnection = async () => {
    const key = tokenInput.trim();
    if (!key) {
      setClientTestResult("لطفاً ابتدا توکن را در فیلد بالا وارد کنید.");
      return;
    }
    setClientTesting(true);
    setClientTestResult(null);
    try {
      let ok = false;
      let msg = "";
      if (selectedProvider === "gemini") {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key),
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "سلام" }] }] }) },
        );
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به Gemini" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      } else if (selectedProvider === "openrouter") {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Medalino",
          },
          body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: "سلام" }], max_tokens: 10 }),
        });
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به OpenRouter" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      } else {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: "سلام" }], max_tokens: 10 }),
        });
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به DeepSeek" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      }
      setClientTestResult(msg);
    } catch (e) {
      setClientTestResult(e instanceof Error ? e.message : "خطا");
    } finally {
      setClientTesting(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...settings, defaultAiProvider: selectedProvider }),
      });
      const j = await res.json();
      if (j.ok) setMessage("تنظیمات سایت ذخیره شد.");
      else setMessage(j.message ?? "خطا در ذخیره");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSaving(false);
    }
  };

  const savePrompts = async () => {
    setSavingPrompts(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentPrompt, productPrompt }),
      });
      const j = await res.json();
      if (j.ok) setMessage("پرامپت‌ها ذخیره شدند.");
      else setMessage(j.message ?? "خطا در ذخیره پرامپت");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSavingPrompts(false);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { setMessage("حجم فایل باید کمتر از 500KB باشد"); return; }
    const reader = new FileReader();
    reader.onload = () => setSettings((prev) => ({ ...prev, faviconDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const update = (key: keyof SiteSettingsForm, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="p-8 text-sm">در حال بارگذاری…</p>;

  const statusDot = (provider: string, configured: boolean, connState: ConnectionState) => {
    const base = !configured
      ? { color: "#6b7280", label: "پیکربندی نشده", blink: false }
      : connState === "testing"
        ? { color: "#f59e0b", label: "در حال بررسی…", blink: false }
        : connState === "connected"
          ? { color: "#22c55e", label: "متصل", blink: true }
          : connState === "failed"
            ? { color: "#ef4444", label: "خطا در اتصال", blink: true }
            : { color: "#6b7280", label: "—", blink: false };
    return { ...base };
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <style>{`
        @keyframes ai-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .dot-blink {
          animation: ai-blink 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">تنظیمات</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {activeTab === "general" ? "مدیریت مشخصات سایت" : "اتصال به سرویس‌های هوش مصنوعی، پرامپت‌ها و آمار"}
          </p>
        </div>
        {activeTab === "general" ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSettings()}
            className="rounded-md px-6 py-2 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "در حال ذخیره…" : "ذخیرهٔ تنظیمات"}
          </button>
        ) : null}
      </div>

      <div className="flex gap-1 rounded-md p-1" style={{ background: "var(--bg-muted)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: "var(--text)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
          {message}
        </div>
      )}

      {activeTab === "general" && (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Surface title="مشخصات سایت">
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium">
                  نام سایت
                  <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
                </label>
                <label className="text-sm font-medium">
                  توضیحات سایت
                  <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteDescription} onChange={(e) => update("siteDescription", e.target.value)} />
                </label>
                <label className="text-sm font-medium">
                  آدرس سایت
                  <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteUrl} onChange={(e) => update("siteUrl", e.target.value)} dir="ltr" />
                </label>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">Favicon</p>
                <div className="flex items-center gap-4">
                  {settings.faviconDataUrl ? (
                    <img src={settings.faviconDataUrl} alt="favicon" className="h-10 w-10 rounded" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded text-xs" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>بدون آیکون</div>
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handleFaviconUpload} className="text-sm" />
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>فرمت ICO یا PNG — حداکثر 500KB</p>
                  </div>
                </div>
              </div>
            </Surface>

            <Surface title="رنگ‌بندی">
              <label className="text-sm font-medium">
                حالت تم
                <select className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.theme} onChange={(e) => update("theme", e.target.value)}>
                  <option value="dark">تاریک</option>
                  <option value="light">روشن</option>
                  <option value="auto">خودکار (سیستم)</option>
                </select>
              </label>

              <div className="mt-4 flex gap-1 rounded-md p-1" style={{ background: "var(--bg-muted)" }}>
                {(["dark", "light"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setColorMode(mode)}
                    className="flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      background: colorMode === mode ? "var(--surface)" : "transparent",
                      color: "var(--text)",
                    }}
                  >
                    {mode === "dark" ? "تاریک" : "روشن"}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {COLOR_FIELDS[colorMode].map(({ key, label }) => (
                  <label key={key} className="text-xs">
                    {label}
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={settings[key as keyof SiteSettingsForm] as string}
                        onChange={(e) => update(key as keyof SiteSettingsForm, e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border"
                      />
                      <input
                        className="flex-1 rounded border p-1 text-xs font-mono"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                        value={settings[key as keyof SiteSettingsForm] as string}
                        onChange={(e) => update(key as keyof SiteSettingsForm, e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </Surface>
          </div>

          <div className="flex flex-col gap-6">
            <Surface title="اتصال به هوش مصنوعی">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                برای مدیریت اتصال به سرویس‌های هوش مصنوعی به تب هوش مصنوعی بروید.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {PROVIDERS.map((p) => {
                  const st = p.id === "gemini" ? geminiStatus : p.id === "openrouter" ? openrouterStatus : deepseekStatus;
                  const conn = aiConnections[p.id];
                  const dot = statusDot(p.id, st.configured, conn);
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`${dot.blink ? "dot-blink" : ""}`}
                        style={{ color: dot.color, fontSize: "1.2rem", lineHeight: "1" }}
                      >●</span>
                      <span style={{ color: "var(--text)" }}>{p.label}</span>
                      {st.configured && (
                        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {st.maskedKey}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="grid gap-6 md:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-6">
            <Surface title="اتصال به هوش مصنوعی">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                انتخاب سرویس، ذخیره توکن و تست اتصال
              </p>

              <label className="mt-4 block text-sm font-medium">
                سرویس هوش مصنوعی
                <select
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={selectedProvider}
                  onChange={(e) => { setSelectedProvider(e.target.value); setTestResult(null); }}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </label>

              {providerStatus.configured && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span style={{ color: "#22c55e" }}>●</span>
                  <span>{providerStatus.maskedKey}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({providerStatus.source === "env" ? "متغیر محیطی" : "ذخیره محلی"})
                  </span>
                </div>
              )}

              <label className="mt-4 block text-sm font-medium">
                توکن API جدید
                <input
                  type="password"
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={currentPlaceholder}
                  dir="ltr"
                />
              </label>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={savingToken || !tokenInput.trim()}
                  onClick={() => void saveToken()}
                  className="rounded-md px-4 py-2 text-sm font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {savingToken ? "در حال ذخیره…" : "ذخیرهٔ توکن"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={testing || !providerStatus.configured}
                    onClick={() => void testConnection()}
                    className="flex-1 rounded-md border px-3 py-2 text-sm font-bold"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    {testing ? "در حال تست…" : "تست (سرور)"}
                  </button>
                  <button
                    type="button"
                    disabled={clientTesting || !tokenInput.trim()}
                    onClick={() => void testDirectConnection()}
                    className="flex-1 rounded-md border px-3 py-2 text-sm font-bold"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    {clientTesting ? "در حال تست…" : "تست (مرورگر)"}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="mt-4 rounded-md border p-3 text-sm" style={{
                  borderColor: testResult.includes("موفق") ? "var(--border)" : "#ef4444",
                  background: "var(--surface)",
                  color: testResult.includes("موفق") ? "#22c55e" : "#ef4444",
                }}>
                  <span className="text-[10px] font-bold opacity-60">SERVER</span> {testResult}
                </div>
              )}

              {clientTestResult && (
                <div className="mt-2 rounded-md border p-3 text-sm" style={{
                  borderColor: clientTestResult.includes("موفق") ? "var(--border)" : "#ef4444",
                  background: "var(--surface)",
                  color: clientTestResult.includes("موفق") ? "#22c55e" : "#ef4444",
                }}>
                  <span className="text-[10px] font-bold opacity-60">CLIENT</span> {clientTestResult}
                </div>
              )}

              {selectedProvider === "openrouter" && models.length > 0 && (
                <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                  <label className="block text-sm font-medium">
                    مدل OpenRouter
                    <div className="mt-1 flex gap-2">
                      <select
                        className="flex-1 rounded-md border p-2 text-sm"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>{m.name || m.id}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedModel) return;
                          const res = await fetch("/api/settings/site", {
                            method: "PUT",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ openrouterModel: selectedModel }),
                          });
                          const j = await res.json();
                          setMessage(j.ok ? "مدل OpenRouter ذخیره شد." : "خطا در ذخیره مدل");
                        }}
                        className="rounded-md px-3 py-2 text-sm font-bold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        ذخیره
                      </button>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>وضعیت سرویس‌ها</p>
                <div className="flex flex-col gap-2">
                  {PROVIDERS.map((p) => {
                    const st = p.id === "gemini" ? geminiStatus : p.id === "openrouter" ? openrouterStatus : deepseekStatus;
                    const conn = aiConnections[p.id];
                    const dot = statusDot(p.id, st.configured, conn);
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={`${dot.blink ? "dot-blink" : ""}`}
                          style={{ color: dot.color, fontSize: "1.2rem", lineHeight: "1" }}
                        >●</span>
                        <span style={{ color: "var(--text)" }}>{p.label}</span>
                        {st.configured && (
                          <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {st.maskedKey}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: dot.color }}>{dot.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Surface>

            <Surface title="پرامپت‌های پیش‌فرض">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                این پرامپت‌ها برای تولید محتوا و محصول استفاده می‌شوند. {'{title}'}، {'{body}'} و {'{keywords}'} به‌طور خودکار جایگزین می‌شوند.
              </p>

              <label className="mt-4 block text-sm font-medium">
                پرامپت تولید محتوا
                <textarea
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: "200px" }}
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  dir="ltr"
                />
              </label>

              <label className="mt-4 block text-sm font-medium">
                پرامپت تولید محصول
                <textarea
                  className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: "200px" }}
                  value={productPrompt}
                  onChange={(e) => setProductPrompt(e.target.value)}
                  dir="ltr"
                />
              </label>

              <button
                type="button"
                disabled={savingPrompts}
                onClick={() => void savePrompts()}
                className="mt-4 rounded-md px-4 py-2 text-sm font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {savingPrompts ? "در حال ذخیره…" : "ذخیرهٔ پرامپت‌ها"}
              </button>
            </Surface>
          </div>

          <div className="flex flex-col gap-6">
            <Surface title="آمار مصرف">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                تعداد توکن مصرفی هر سرویس
              </p>

              <div className="mt-3 flex gap-2">
                {usageLoading ? null : (
                  <button
                    type="button"
                    onClick={() => void fetchUsage()}
                    className="rounded-md border px-3 py-1.5 text-xs font-bold"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    بروزرسانی
                  </button>
                )}
              </div>

              {usageLoading ? (
                <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>در حال بارگذاری…</p>
              ) : Object.keys(tokenUsage).length > 0 ? (
                <div className="mt-3 overflow-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr>
                        <th className="pb-1.5 font-medium">سرویس</th>
                        <th className="pb-1.5 font-medium">درخواست</th>
                        <th className="pb-1.5 font-medium">توکن کل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tokenUsage).map(([provider, u]) => (
                        <tr key={provider} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="py-1.5">{provider === "gemini" ? "Gemini" : provider === "openrouter" ? "OpenRouter" : "DeepSeek"}</td>
                          <td className="py-1.5 font-mono">{u.requests.toLocaleString("fa-IR")}</td>
                          <td className="py-1.5 font-mono" dir="ltr">{u.totalTokens.toLocaleString("fa-IR")}</td>
                        </tr>
                      ))}
                      {usageTotals && (
                        <tr className="border-t font-bold" style={{ borderColor: "var(--border)" }}>
                          <td className="py-1.5">جمع</td>
                          <td className="py-1.5 font-mono">{usageTotals.requests.toLocaleString("fa-IR")}</td>
                          <td className="py-1.5 font-mono" dir="ltr">{usageTotals.totalTokens.toLocaleString("fa-IR")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {usageLoading ? "" : "هنوز مصرفی ثبت نشده است."}
                </p>
              )}
            </Surface>
          </div>
        </div>
      )}
    </div>
  );
}
