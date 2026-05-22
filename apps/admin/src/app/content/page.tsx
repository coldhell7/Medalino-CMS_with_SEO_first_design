"use client";

import { useState } from "react";
import { Surface } from "@repo/ui/react";

export default function ContentPage() {
  const [title, setTitle] = useState("میکس الکترولیت روزانه");
  const [keywords, setKeywords] = useState("الکترولیت، آبرسانی، سلامت");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");

  const [postTitle, setPostTitle] = useState("اصول خواب منظم");
  const [postKeywords, setPostKeywords] = useState("بهداشت خواب، سبک زندگی");
  const [loadingPost, setLoadingPost] = useState(false);
  const [outputPost, setOutputPost] = useState<string>("");

  const parseApiResponse = async (res: Response) => {
    const raw = await res.text();
    if (!raw.trim()) {
      return { error: `پاسخ خالی از سرور (کد ${res.status})` };
    }
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { error: raw };
    }
  };

  const runProduct = async () => {
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/ai/product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, keywords }),
      });
      const json = await parseApiResponse(res);
      setOutput(JSON.stringify(json, null, 2));
    } catch (e) {
      setOutput(String(e));
    } finally {
      setLoading(false);
    }
  };

  const runPost = async () => {
    setLoadingPost(true);
    setOutputPost("");
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: postTitle, keywords: postKeywords }),
      });
      const json = await parseApiResponse(res);
      setOutputPost(JSON.stringify(json, null, 2));
    } catch (e) {
      setOutputPost(String(e));
    } finally {
      setLoadingPost(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">محتوا و هوش مصنوعی</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          توکن Google Gemini را از صفحهٔ تنظیمات مدیریت کنید. تولید پیش‌نویس محصول و نوشته از همین کلید استفاده می‌کند.
        </p>
      </div>

      <Surface title="تکمیل خودکار محصول">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">
            عنوان
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            کلمات کلیدی
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runProduct()}
          disabled={loading}
          className="mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "در حال اجرا…" : "تولید پیش‌نویس محصول"}
        </button>
        {output ? (
          <pre
            className="mt-4 max-h-96 overflow-auto rounded-md border p-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text)", direction: "ltr", textAlign: "left" }}
          >
            {output}
          </pre>
        ) : null}
      </Surface>

      <Surface title="تولید پیش‌نویس نوشته (مجله)">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">
            عنوان موضوع
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            زاویه / کلمات کلیدی
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={postKeywords}
              onChange={(e) => setPostKeywords(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runPost()}
          disabled={loadingPost}
          className="mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {loadingPost ? "در حال اجرا…" : "تولید پیش‌نویس نوشته"}
        </button>
        {outputPost ? (
          <pre
            className="mt-4 max-h-96 overflow-auto rounded-md border p-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text)", direction: "ltr", textAlign: "left" }}
          >
            {outputPost}
          </pre>
        ) : null}
      </Surface>
    </div>
  );
}
