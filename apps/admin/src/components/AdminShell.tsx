"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "داشبورد" },
  { href: "/cms", label: "مدیریت محتوا" },
  { href: "/cms/products", label: "محصولات" },
  { href: "/orders", label: "سفارش‌ها" },
  { href: "/users", label: "کاربران" },
  { href: "/crm", label: "ارتباط با مشتری" },
  { href: "/content", label: "محتوا و هوش مصنوعی" },
  { href: "/seo", label: "تحلیلگر سئو" },
  { href: "/homepage-builder", label: "طراحی صفحه اصلی" },
  { href: "/settings", label: "تنظیمات" },
];

const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:4321";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [siteName, setSiteName] = useState("مدالینو");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok && j.settings.siteName) {
          setSiteName(j.settings.siteName);
        }
      } catch {
        // use defaults
      }
    })();
  }, []);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div
      data-theme="admin"
      className="min-h-screen"
      style={{
        display: "grid",
        gridTemplateColumns: collapsed ? "72px 1fr" : "240px 1fr",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        transition: "grid-template-columns 0.2s ease",
      }}
    >
      <aside
        className="flex flex-col gap-4 p-4"
        style={{
          borderInlineEnd: "1px solid var(--border)",
          background: "var(--bg-elevated)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          {mounted && !collapsed ? (
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {siteName}
            </span>
          ) : !collapsed ? (
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
              مدالینو
            </span>
          ) : null}
          <button
            type="button"
            aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
            onClick={() => setCollapsed((c) => !c)}
            className="cursor-pointer rounded-md border px-2 py-1 text-sm"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {collapsed ? "⟩" : "⟨"}
          </button>
        </div>
        <nav className="flex flex-col gap-1.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="rounded-md px-3 py-2 text-sm no-underline transition hover:opacity-90"
              style={{ color: "var(--text)" }}
            >
              {collapsed ? item.label.slice(0, 1) : item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <header
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            پنل مدیریت
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border px-3 py-1.5 text-sm font-bold"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              خروج
            </button>
            <Link
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-3 py-1.5 text-sm font-bold no-underline"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                background: "var(--surface)",
              }}
            >
              مشاهدهٔ فروشگاه
            </Link>
          </span>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
