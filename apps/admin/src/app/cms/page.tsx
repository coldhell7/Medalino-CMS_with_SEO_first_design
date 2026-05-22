import Link from "next/link";
import { Surface } from "@repo/ui/react";

const cards = [
  {
    href: "/cms/posts",
    title: "نوشته‌ها",
    desc: "مثل «نوشته‌ها» در وردپرس: فهرست، پیش‌نویس و انتشار.",
  },
  {
    href: "/cms/products",
    title: "محصولات",
    desc: "قیمت، سئو، اسکیما و انتشار روی فروشگاه.",
  },
  {
    href: "/cms/pages",
    title: "برگه‌ها",
    desc: "صفحات ثابت مثل درباره ما و تماس.",
  },
  {
    href: "/cms/media",
    title: "رسانه",
    desc: "ثبت آدرس تصویر و متن جایگزین (شبیه کتابخانهٔ رسانه).",
  },
];

export default function CmsHomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">مدیریت محتوا</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          امکانات پایه شبیه وردپرس: نوشته، برگه و رسانه. داده‌ها در پکیج <code style={{ fontSize: "0.85em" }}>@repo/cms</code> ذخیره
          می‌شوند تا فروشگاه همان منبع را بخواند.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="no-underline" style={{ color: "inherit" }}>
            <Surface title={c.title}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {c.desc}
              </p>
              <span className="mt-3 inline-block text-sm font-bold" style={{ color: "var(--accent)" }}>
                ورود →
              </span>
            </Surface>
          </Link>
        ))}
      </div>
    </div>
  );
}
