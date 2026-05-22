"use client";

import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";

type BlockType =
  | "hero"
  | "stats"
  | "trust"
  | "categories"
  | "products"
  | "mid_banner"
  | "quotes"
  | "promo"
  | "text"
  | "image"
  | "cta"
  | "media_press"
  | "spacer";

type CmsBlock = {
  id: string;
  type: BlockType;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "بنر اصلی",
  stats: "آمار",
  trust: "اعتمادسازی",
  categories: "دسته‌بندی‌ها",
  products: "محصولات",
  mid_banner: "بنر میانی",
  quotes: "نظرات مشتریان",
  promo: "پروموشن",
  text: "متن آزاد",
  image: "تصویر",
  cta: "دکمه فراخوان",
  media_press: "رسانه‌ها",
  spacer: "فاصله",
};

const DEFAULT_DATA: Record<BlockType, Record<string, unknown>> = {
  hero: {
    kicker: "سلامت شما، اولویت ماست",
    title: "از مکمل تا تجهیزات پزشکی",
    lead: "مدالینو ترکیبی از کیفیت و قیمت شفاف است.",
    image: "/images/hero-home.jpg",
    imageAlt: "مدالینو",
    badgeText: "پیشنهاد هفته",
    badgeDesc: "پکیج آبرسانی + الکترولیت",
    buttons: [
      { label: "مشاهده محصولات", href: "#featured", variant: "primary" },
      { label: "مجله سلامت", href: "/blog", variant: "ghost" },
    ],
  },
  stats: {
    title: "آمار مدالینو",
    items: [
      { value: "۴۰٬۰۰۰+", label: "ارسال موفق" },
      { value: "۹۸٪", label: "رضایت خریداران" },
      { value: "۲۴h", label: "ارسال سریع" },
      { value: "۵۰۰+", label: "محصول اصل" },
    ],
  },
  trust: {
    items: [
      { icon: "🚚", title: "ارسال همان‌روز", desc: "تهران و حومه" },
      { icon: "🛡️", title: "تضمین اصالت", desc: "رهگیری و فاکتور" },
      { icon: "💬", title: "پشتیبانی", desc: "۹ تا ۱۸ هر روز" },
      { icon: "↩️", title: "۷ روز بازگشت", desc: "کالای سالم" },
    ],
  },
  categories: {
    eyebrow: "کاوش سریع",
    title: "دسته‌های داغ",
    subtitle: "دسته‌های پرطرفدار",
    linkText: "مشاهده همه ←",
    linkHref: "#featured",
    items: [
      { title: "مکمل و ویتامین", subtitle: "امگا، زینک، D3", hue: 168, gid: "c1", coverImage: "/images/categories/supplements.jpg" },
      { title: "مراقبت پوست", subtitle: "آبرسان، ترمیم", hue: 320, gid: "c2", coverImage: "/images/categories/skincare.jpg" },
    ],
  },
  products: {
    eyebrow: "پرفروش‌ها",
    title: "منتخب محصولات",
    subtitle: "کالاهای منتشرشده",
    linkText: "",
    linkHref: "",
    source: "all",
  },
  mid_banner: {
    image: "/images/banners/mid-banner.jpg",
    title: "آماده‌اید برای یک روتین قوی‌تر؟",
    text: "مکمل، پوست و تجهیزات خانگی را یکجا ببینید.",
    buttonLabel: "شروع خرید",
    buttonHref: "#featured",
  },
  quotes: {
    title: "صدای خریداران",
    items: [
      { text: "بسته‌بندی تمیز و ارسال سریع", author: "سارا · تهران" },
      { text: "رابط فارسی روان و قیمت مناسب", author: "امیر · شیراز" },
    ],
  },
  promo: {
    title: "باشگاه مشتریان",
    text: "با هر خرید امتیاز بگیرید.",
    image: "/images/banners/promo.jpg",
    imageAlt: "باشگاه مشتریان",
    codeLabel: "کد هدیه",
    codeValue: "MEDALINO-10",
    codeHint: "تا ۱۰٪ تخفیف",
  },
  media_press: {
    title: "دیده شدیم در",
    items: [
      { name: "خبرگزاری سلامت", logo: "/images/press/health-news.png", url: "#", quote: "پلتفرم نوین فروش مکمل" },
      { name: "مجله زندگی سالم", logo: "/images/press/healthy-life.png", url: "#", quote: "تجربه خرید مطمئن" },
    ],
  },
  text: { content: "متن دلخواه شما..." },
  image: { src: "/images/hero-home.jpg", alt: "تصویر", caption: "" },
  cta: { text: "همین الان شروع کنید", buttonLabel: "ثبت‌نام", buttonHref: "#" },
  spacer: { height: 40 },
};

function StringField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <input
        className="mt-1 w-full rounded border p-2 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <textarea
        rows={3}
        className="mt-1 w-full rounded border p-2 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <select
        className="mt-1 w-full rounded border p-2 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ArrayEditor<T extends Record<string, unknown>>({
  title,
  items,
  fields,
  onChange,
}: {
  title: string;
  items: T[];
  fields: { key: keyof T; label: string; type?: "text" | "textarea" | "color" | "select"; options?: { label: string; value: string }[] }[];
  onChange: (items: T[]) => void;
}) {
  const updateItem = (idx: number, key: keyof T, value: unknown) => {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };

  const addItem = () => {
    const empty = {} as T;
    fields.forEach((f) => { empty[f.key] = (f.type === "select" && f.options ? f.options[0].value : "") as T[keyof T] });
    onChange([...items, empty]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <button onClick={addItem} className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
          + افزودن
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>#{idx + 1}</span>
              <button onClick={() => removeItem(idx)} className="rounded border px-2 py-0.5 text-xs" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                حذف
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fields.map((f) => {
                const val = String(item[f.key] ?? "");
                if (f.type === "textarea") {
                  return (
                    <TextAreaField
                      key={String(f.key)}
                      label={f.label}
                      value={val}
                      onChange={(v) => updateItem(idx, f.key, v)}
                    />
                  );
                }
                if (f.type === "select" && f.options) {
                  return (
                    <SelectField
                      key={String(f.key)}
                      label={f.label}
                      value={val}
                      options={f.options}
                      onChange={(v) => updateItem(idx, f.key, v)}
                    />
                  );
                }
                return (
                  <StringField
                    key={String(f.key)}
                    label={f.label}
                    value={val}
                    onChange={(v) => updateItem(idx, f.key, v)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({ block, onUpdate }: { block: CmsBlock; onUpdate: (data: Record<string, unknown>) => void }) {
  const d = block.data;
  const set = (key: string, value: unknown) => onUpdate({ ...d, [key]: value });

  switch (block.type) {
    case "hero":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="عنوان کوچک (kicker)" value={d.kicker as string} onChange={(v) => set("kicker", v)} />
          <StringField label="عنوان اصلی" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextAreaField label="توضیح" value={d.lead as string} onChange={(v) => set("lead", v)} />
          <StringField label="تصویر" value={d.image as string} onChange={(v) => set("image", v)} />
          <StringField label="متن جایگزین تصویر" value={d.imageAlt as string} onChange={(v) => set("imageAlt", v)} />
          <StringField label="متن بج" value={d.badgeText as string} onChange={(v) => set("badgeText", v)} />
          <StringField label="توضیح بج" value={d.badgeDesc as string} onChange={(v) => set("badgeDesc", v)} />
          <ArrayEditor
            title="دکمه‌ها"
            items={(d.buttons as Array<{ label: string; href: string; variant: string }>) || []}
            fields={[
              { key: "label", label: "متن دکمه" },
              { key: "href", label: "لینک" },
              { key: "variant", label: "استایل", type: "select", options: [{ label: "اصلی", value: "primary" }, { label: "حاشیه‌ای", value: "ghost" }] },
            ]}
            onChange={(v) => set("buttons", v)}
          />
        </div>
      );

    case "stats":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="عنوان بخش" value={d.title as string} onChange={(v) => set("title", v)} />
          <ArrayEditor
            title="آیتم‌های آمار"
            items={(d.items as Array<{ value: string; label: string }>) || []}
            fields={[
              { key: "value", label: "مقدار" },
              { key: "label", label: "توضیح" },
            ]}
            onChange={(v) => set("items", v)}
          />
        </div>
      );

    case "trust":
      return (
        <ArrayEditor
          title="آیتم‌های اعتمادسازی"
          items={(d.items as Array<{ icon: string; title: string; desc: string }>) || []}
          fields={[
            { key: "icon", label: "آیکون (emoji)" },
            { key: "title", label: "عنوان" },
            { key: "desc", label: "توضیح" },
          ]}
          onChange={(v) => set("items", v)}
        />
      );

    case "categories":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="بالاچشمی (eyebrow)" value={d.eyebrow as string} onChange={(v) => set("eyebrow", v)} />
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <StringField label="زیرعنوان" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <StringField label="متن لینک" value={d.linkText as string} onChange={(v) => set("linkText", v)} />
          <StringField label="لینک" value={d.linkHref as string} onChange={(v) => set("linkHref", v)} />
          <ArrayEditor
            title="دسته‌بندی‌ها"
            items={(d.items as Array<{ title: string; subtitle: string; hue: number; gid: string; coverImage: string }>) || []}
            fields={[
              { key: "title", label: "عنوان" },
              { key: "subtitle", label: "توضیح" },
              { key: "hue", label: "رنگ (hue)" },
              { key: "gid", label: "شناسه" },
              { key: "coverImage", label: "تصویر" },
            ]}
            onChange={(v) => set("items", v)}
          />
        </div>
      );

    case "products":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="بالاچشمی" value={d.eyebrow as string} onChange={(v) => set("eyebrow", v)} />
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <StringField label="زیرعنوان" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <StringField label="متن لینک" value={d.linkText as string} onChange={(v) => set("linkText", v)} />
          <StringField label="لینک" value={d.linkHref as string} onChange={(v) => set("linkHref", v)} />
          <SelectField
            label="منبع محصولات"
            value={d.source as string}
            options={[
              { label: "همه محصولات", value: "all" },
              { label: "ویژه‌ها", value: "featured" },
            ]}
            onChange={(v) => set("source", v)}
          />
        </div>
      );

    case "mid_banner":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="تصویر" value={d.image as string} onChange={(v) => set("image", v)} />
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextAreaField label="متن" value={d.text as string} onChange={(v) => set("text", v)} />
          <StringField label="متن دکمه" value={d.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <StringField label="لینک دکمه" value={d.buttonHref as string} onChange={(v) => set("buttonHref", v)} />
        </div>
      );

    case "quotes":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <ArrayEditor
            title="نظرات"
            items={(d.items as Array<{ text: string; author: string }>) || []}
            fields={[
              { key: "text", label: "متن نظر", type: "textarea" },
              { key: "author", label: "نویسنده" },
            ]}
            onChange={(v) => set("items", v)}
          />
        </div>
      );

    case "promo":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextAreaField label="متن" value={d.text as string} onChange={(v) => set("text", v)} />
          <StringField label="تصویر" value={d.image as string} onChange={(v) => set("image", v)} />
          <StringField label="متن جایگزین" value={d.imageAlt as string} onChange={(v) => set("imageAlt", v)} />
          <StringField label="برچسب کد" value={d.codeLabel as string} onChange={(v) => set("codeLabel", v)} />
          <StringField label="مقدار کد" value={d.codeValue as string} onChange={(v) => set("codeValue", v)} />
          <StringField label="توضیح کد" value={d.codeHint as string} onChange={(v) => set("codeHint", v)} />
        </div>
      );

    case "media_press":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="عنوان" value={d.title as string} onChange={(v) => set("title", v)} />
          <ArrayEditor
            title="رسانه‌ها"
            items={(d.items as Array<{ name: string; logo: string; url: string; quote: string }>) || []}
            fields={[
              { key: "name", label: "نام رسانه" },
              { key: "logo", label: "لوگو (مسیر)" },
              { key: "url", label: "لینک" },
              { key: "quote", label: "نقل قول" },
            ]}
            onChange={(v) => set("items", v)}
          />
        </div>
      );

    case "text":
      return <TextAreaField label="محتوا" value={d.content as string} onChange={(v) => set("content", v)} />;

    case "image":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="مسیر تصویر" value={d.src as string} onChange={(v) => set("src", v)} />
          <StringField label="متن جایگزین" value={d.alt as string} onChange={(v) => set("alt", v)} />
          <StringField label="کپشن" value={d.caption as string} onChange={(v) => set("caption", v)} />
        </div>
      );

    case "cta":
      return (
        <div className="flex flex-col gap-3">
          <StringField label="متن" value={d.text as string} onChange={(v) => set("text", v)} />
          <StringField label="متن دکمه" value={d.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <StringField label="لینک دکمه" value={d.buttonHref as string} onChange={(v) => set("buttonHref", v)} />
        </div>
      );

    case "spacer":
      return (
        <label className="block text-xs font-medium">
          ارتفاع (px)
          <input
            type="number"
            className="mt-1 w-full rounded border p-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            value={d.height as number}
            onChange={(e) => set("height", Number(e.target.value))}
          />
        </label>
      );

    default:
      return <p className="text-sm" style={{ color: "var(--text-muted)" }}>ویرایشگر برای این بلوک موجود نیست</p>;
  }
}

export default function HomepageBuilderPage() {
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/homepage-blocks");
        const j = await res.json();
        if (j.ok) setBlocks(j.blocks);
      } catch {
        setMessage("خطا در بارگذاری");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/homepage-blocks", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      const j = await res.json();
      if (j.ok) setMessage("ذخیره شد. برای اعمال روی سایت، فروشگاه را rebuild کنید.");
      else setMessage(j.message ?? "خطا");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: CmsBlock = {
      id: `b${Date.now()}`,
      type,
      enabled: true,
      order: blocks.length + 1,
      data: { ...DEFAULT_DATA[type] },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setEditingId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((b, i) => ({ ...b, order: i + 1 }));
    });
  };

  const toggleBlock = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)),
    );
  };

  const updateBlockData = (id: string, data: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data } : b)),
    );
  };

  if (loading) return <p className="p-8">در حال بارگذاری…</p>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">طراحی صفحه اصلی</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            بلوک‌ها را اضافه، حذف و مرتب کنید. تغییرات پس از rebuild فروشگاه اعمال می‌شود.
          </p>
        </div>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="rounded-md px-6 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </div>

      {message && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        >
          {message}
        </div>
      )}

      <Surface title="افزودن بلوک">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              + {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      </Surface>

      <div className="flex flex-col gap-4">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="rounded-lg border"
            style={{
              borderColor: block.enabled ? "var(--border)" : "var(--border)",
              background: block.enabled ? "var(--bg-elevated)" : "var(--surface)",
              opacity: block.enabled ? 1 : 0.6,
            }}
          >
            <div className="flex items-center gap-3 p-4">
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {idx + 1}
              </span>
              <span className="text-sm font-semibold">{BLOCK_LABELS[block.type]}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: block.enabled ? "var(--success)" : "var(--text-muted)",
                  color: block.enabled ? "#fff" : "var(--bg)",
                }}
              >
                {block.enabled ? "فعال" : "غیرفعال"}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => moveBlock(block.id, "up")}
                disabled={idx === 0}
                className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                ↑
              </button>
              <button
                onClick={() => moveBlock(block.id, "down")}
                disabled={idx === blocks.length - 1}
                className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                ↓
              </button>
              <button
                onClick={() => toggleBlock(block.id)}
                className="rounded border px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {block.enabled ? "غیرفعال" : "فعال"}
              </button>
              <button
                onClick={() => setEditingId(editingId === block.id ? null : block.id)}
                className="rounded border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {editingId === block.id ? "بستن ویرایشگر" : "ویرایش"}
              </button>
              <button
                onClick={() => removeBlock(block.id)}
                className="rounded border px-2 py-1 text-xs"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                حذف
              </button>
            </div>

            {editingId === block.id && (
              <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
                <BlockEditor block={block} onUpdate={(data) => updateBlockData(block.id, data)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="rounded-lg border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-lg font-semibold">هیچ بلوکی وجود ندارد</p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            از دکمه‌های بالا بلوک اضافه کنید
          </p>
        </div>
      )}
    </div>
  );
}
