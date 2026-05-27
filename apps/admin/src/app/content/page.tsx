"use client";

import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";

type ProductResult = {
  metaTitle: string;
  metaDescription: string;
  description: string;
  imageAlts: string[];
  workflowHint: string;
};
type PostResult = {
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  body: string;
  suggestedCategories: string[];
};

function ProductResultView({ data }: { data: ProductResult }) {
  return (
    <div className="flex flex-col gap-3">
      {data.metaTitle && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>عنوان سئو</span>
          <p className="mt-1 rounded bg-black/10 p-2 text-sm">{data.metaTitle}</p>
        </div>
      )}
      {data.metaDescription && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>توضیحات متا</span>
          <p className="mt-1 rounded bg-black/10 p-2 text-sm">{data.metaDescription}</p>
        </div>
      )}
      {data.description && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>توضیحات</span>
          <div
            className="mt-1 rounded bg-black/10 p-2 text-sm [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        </div>
      )}
      {data.imageAlts && data.imageAlts.length > 0 && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>متن جایگزین تصاویر</span>
          <ul className="mt-1 space-y-1">
            {data.imageAlts.map((a, i) => (
              <li key={i} className="rounded bg-black/10 p-2 text-xs">{a}</li>
            ))}
          </ul>
        </div>
      )}
      {data.workflowHint && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>نکته</span>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{data.workflowHint}</p>
        </div>
      )}
    </div>
  );
}

function PostResultView({ data }: { data: PostResult }) {
  return (
    <div className="flex flex-col gap-3">
      {data.metaTitle && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>عنوان سئو</span>
          <p className="mt-1 rounded bg-black/10 p-2 text-sm">{data.metaTitle}</p>
        </div>
      )}
      {data.metaDescription && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>توضیحات متا</span>
          <p className="mt-1 rounded bg-black/10 p-2 text-sm">{data.metaDescription}</p>
        </div>
      )}
      {data.excerpt && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>خلاصه</span>
          <p className="mt-1 rounded bg-black/10 p-2 text-sm">{data.excerpt}</p>
        </div>
      )}
      {data.body && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>متن اصلی</span>
          <div
            className="mt-1 rounded bg-black/10 p-2 text-sm [&_p]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold"
            dangerouslySetInnerHTML={{ __html: data.body }}
          />
        </div>
      )}
      {data.suggestedCategories && data.suggestedCategories.length > 0 && (
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>دسته‌ها</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {data.suggestedCategories.map((c, i) => (
              <span key={i} className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--accent)", color: "white" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentPage() {
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const [postTitle, setPostTitle] = useState("");
  const [postKeywords, setPostKeywords] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [outputPost, setOutputPost] = useState<string | null>(null);

  const [providerReady, setProviderReady] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [geminiRes, openrouterRes, deepseekRes] = await Promise.all([
          fetch("/api/settings/gemini").then((r) => r.json()).catch(() => ({ configured: false })),
          fetch("/api/settings/openrouter").then((r) => r.json()).catch(() => ({ configured: false })),
          fetch("/api/settings/deepseek").then((r) => r.json()).catch(() => ({ configured: false })),
        ]);
        setProviderReady(
          (geminiRes as { configured?: boolean }).configured === true ||
          (openrouterRes as { configured?: boolean }).configured === true ||
          (deepseekRes as { configured?: boolean }).configured === true
        );
      } catch {
        setProviderReady(null);
      }
    })();
  }, []);

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
    setOutput(null);
    try {
      const res = await fetch("/api/ai/product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, keywords }),
      });
      const json = await parseApiResponse(res);
      if ((json as { error?: string }).error) {
        setOutput(JSON.stringify({ _error: (json as { error: string }).error }));
        return;
      }
      const draft = (json as { draft?: unknown }).draft as ProductResult | undefined;
      if (!draft) {
        setOutput(JSON.stringify({ _error: "پاسخ هوش مصنوعی حاوی داده‌های مورد انتظار نیست." }));
        return;
      }
      setOutput(JSON.stringify(draft));
    } catch (e) {
      setOutput(JSON.stringify({ _error: String(e) }));
    } finally {
      setLoading(false);
    }
  };

  const runPost = async () => {
    setLoadingPost(true);
    setOutputPost(null);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: postTitle, keywords: postKeywords }),
      });
      const json = await parseApiResponse(res);
      if ((json as { error?: string }).error) {
        setOutputPost(JSON.stringify({ _error: (json as { error: string }).error }));
        return;
      }
      const draft = (json as { draft?: unknown }).draft as PostResult | undefined;
      if (!draft) {
        setOutputPost(JSON.stringify({ _error: "پاسخ هوش مصنوعی حاوی داده‌های مورد انتظار نیست." }));
        return;
      }
      setOutputPost(JSON.stringify(draft));
    } catch (e) {
      setOutputPost(JSON.stringify({ _error: String(e) }));
    } finally {
      setLoadingPost(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">محتوا و هوش مصنوعی</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          کلید هوش مصنوعی را از صفحهٔ تنظیمات مدیریت کنید.
        </p>
      </div>

      {providerReady === false && (
        <p className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          ⚠️ هیچ ارائه‌دهندهٔ هوش مصنوعی پیکربندی نشده است. ابتدا از صفحهٔ{' '}
          <a href="/settings" className="font-bold no-underline" style={{ color: "var(--accent)" }}>تنظیمات</a>{' '}
          یک کلید API ثبت کنید.
        </p>
      )}

      {providerReady === null && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          در حال بررسی وضعیت اتصال…
        </p>
      )}

      <Surface title="تکمیل خودکار محصول">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">
            عنوان
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: میکس الکترولیت روزانه"
            />
          </label>
          <label className="text-sm font-medium">
            کلمات کلیدی
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="الکترولیت، آبرسانی، سلامت"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runProduct()}
          disabled={loading}
          className="mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "در حال اجرا…" : "تولید پیش‌نویس محصول"}
        </button>
        {loading && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            در حال دریافت پاسخ از هوش مصنوعی…
          </p>
        )}
        {output && !loading && (
          <div
            className="mt-4 max-h-96 overflow-auto rounded-md border p-3 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {(() => {
              try {
                const data = JSON.parse(output) as ProductResult & { _error?: string };
                if (data._error) return <p className="text-red-400">{data._error}</p>;
                return <ProductResultView data={data} />;
              } catch {
                return <pre className="text-xs">{output}</pre>;
              }
            })()}
          </div>
        )}
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
              placeholder="مثلاً: اصول خواب منظم"
            />
          </label>
          <label className="text-sm font-medium">
            زاویه / کلمات کلیدی
            <input
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              value={postKeywords}
              onChange={(e) => setPostKeywords(e.target.value)}
              placeholder="بهداشت خواب، سبک زندگی"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runPost()}
          disabled={loadingPost}
          className="mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loadingPost ? "در حال اجرا…" : "تولید پیش‌نویس نوشته"}
        </button>
        {loadingPost && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            در حال دریافت پاسخ از هوش مصنوعی…
          </p>
        )}
        {outputPost && !loadingPost && (
          <div
            className="mt-4 max-h-96 overflow-auto rounded-md border p-3 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {(() => {
              try {
                const data = JSON.parse(outputPost) as PostResult & { _error?: string };
                if (data._error) return <p className="text-red-400">{data._error}</p>;
                return <PostResultView data={data} />;
              } catch {
                return <pre className="text-xs">{outputPost}</pre>;
              }
            })()}
          </div>
        )}
      </Surface>
    </div>
  );
}
