"use client";

import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";

type SiteSettings = {
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
};

type GeminiStatus = {
  source: string;
  configured: boolean;
  maskedKey: string | null;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
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
  });

  const [geminiKey, setGeminiKey] = useState("");
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus>({ source: "none", configured: false, maskedKey: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok) {
          setSettings((prev) => ({ ...prev, ...j.settings }));
          setGeminiStatus(j.gemini);
        }
      } catch {
        setMessage("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const j = await res.json();
      if (j.ok) {
        setMessage("تنظیمات ذخیره شد.");
        setGeminiStatus(j.gemini);
      } else {
        setMessage(j.message ?? "خطا در ذخیره");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSaving(false);
    }
  };

  const saveGemini = async () => {
    setSavingGemini(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: geminiKey }),
      });
      const j = await res.json();
      if (j.ok) {
        setMessage("توکن Gemini ذخیره شد.");
        setGeminiKey("");
        const check = await fetch("/api/settings/site");
        const st = await check.json();
        if (st.ok) setGeminiStatus(st.gemini);
      } else {
        setMessage(j.message ?? "خطا");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSavingGemini(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setMessage("حجم فایل باید کمتر از 500KB باشد");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSettings((prev) => ({ ...prev, faviconDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const update = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="p-8">در حال بارگذاری…</p>;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">تنظیمات سایت</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          نام، آدرس، تم رنگی، favicon و توکن Gemini را اینجا مدیریت کنید.
        </p>
      </div>

      {message && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        >
          {message}
        </div>
      )}

      <Surface title="اطلاعات کلی">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">
            نام سایت
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={settings.siteName}
              onChange={(e) => update("siteName", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            توضیحات سایت
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={settings.siteDescription}
              onChange={(e) => update("siteDescription", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            آدرس سایت
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={settings.siteUrl}
              onChange={(e) => update("siteUrl", e.target.value)}
              dir="ltr"
            />
          </label>
        </div>
      </Surface>

      <Surface title="Favicon">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {settings.faviconDataUrl ? (
              <img src={settings.faviconDataUrl} alt="favicon" className="h-10 w-10 rounded" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded text-xs" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                بدون آیکون
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleFaviconUpload} className="text-sm" />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                فرمت ICO یا PNG — حداکثر 500KB
              </p>
            </div>
          </div>
        </div>
      </Surface>

      <Surface title="تم و رنگ‌بندی">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">
            حالت تم
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={settings.theme}
              onChange={(e) => update("theme", e.target.value)}
            >
              <option value="dark">تاریک</option>
              <option value="light">روشن</option>
              <option value="auto">خودکار (سیستم)</option>
            </select>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">رنگ‌های تم تاریک</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                { key: "bgDark", label: "پس‌زمینه" },
                { key: "bgElevatedDark", label: "پس‌زمینه بالا" },
                { key: "surfaceDark", label: "سطح" },
                { key: "textDark", label: "متن" },
                { key: "textMutedDark", label: "متن کم‌رنگ" },
                { key: "accentDark", label: "تأکید" },
              ].map(({ key, label }) => (
                <label key={key} className="text-xs">
                  {label}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[key as keyof SiteSettings] as string}
                      onChange={(e) => update(key as keyof SiteSettings, e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border"
                    />
                    <input
                      className="flex-1 rounded border p-1 text-xs font-mono"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                      value={settings[key as keyof SiteSettings] as string}
                      onChange={(e) => update(key as keyof SiteSettings, e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">رنگ‌های تم روشن</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                { key: "bgLight", label: "پس‌زمینه" },
                { key: "bgElevatedLight", label: "پس‌زمینه بالا" },
                { key: "surfaceLight", label: "سطح" },
                { key: "textLight", label: "متن" },
                { key: "textMutedLight", label: "متن کم‌رنگ" },
                { key: "accentLight", label: "تأکید" },
              ].map(({ key, label }) => (
                <label key={key} className="text-xs">
                  {label}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[key as keyof SiteSettings] as string}
                      onChange={(e) => update(key as keyof SiteSettings, e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border"
                    />
                    <input
                      className="flex-1 rounded border p-1 text-xs font-mono"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                      value={settings[key as keyof SiteSettings] as string}
                      onChange={(e) => update(key as keyof SiteSettings, e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface title="توکن Google Gemini">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {geminiStatus.configured
            ? geminiStatus.source === "env"
              ? "کلید از متغیر محیطی GEMINI_API_KEY خوانده می‌شود."
              : "کلید از ذخیرهٔ محلی پنل خوانده می‌شود."
            : "کلیدی ثبت نشده است."}
        </p>
        {geminiStatus.maskedKey ? (
          <p className="mt-2 font-mono text-xs" style={{ color: "var(--text)" }}>
            {geminiStatus.maskedKey}
          </p>
        ) : null}
        <label className="mt-4 block text-sm font-medium">
          توکن API جدید
          <input
            type="password"
            autoComplete="off"
            className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza…"
            dir="ltr"
          />
        </label>
        <button
          type="button"
          disabled={savingGemini || !geminiKey.trim()}
          onClick={() => void saveGemini()}
          className="mt-3 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {savingGemini ? "در حال ذخیره…" : "ذخیرهٔ توکن"}
        </button>
      </Surface>

      <button
        type="button"
        onClick={() => void saveSettings()}
        disabled={saving}
        className="w-full rounded-md py-3 text-base font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        {saving ? "در حال ذخیره…" : "ذخیرهٔ تمام تنظیمات"}
      </button>
    </div>
  );
}
