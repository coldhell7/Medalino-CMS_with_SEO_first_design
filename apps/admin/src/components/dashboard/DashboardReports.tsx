"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Surface } from "@repo/ui/react";
import { formatJalaliDate } from "@repo/shared";
import { statusLabelFa, normalizeStatus, type OrderStatus } from "@/lib/order-stages";
import {
  formatDuration,
  getDashboardAnalytics,
  type PageDwell,
} from "@/lib/dashboard-analytics";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  customer_name?: string;
};

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  direction: "rtl" as const,
  textAlign: "right" as const,
  borderRadius: 8,
};

function formatToman(cents: number, hydrated: boolean): string {
  const toman = Math.round(cents / 100);
  return hydrated ? `${toman.toLocaleString("fa-IR")} تومان` : `${toman} تومان`;
}

function dwellBarWidth(seconds: number, max: number): string {
  return `${Math.max(8, Math.round((seconds / max) * 100))}%`;
}

type DashboardStats = {
  products: { total: number; published: number; draft: number };
  posts: { total: number; published: number; draft: number };
  pages: { total: number; published: number; draft: number };
  tokenUsage: Record<string, { promptTokens: number; completionTokens: number; totalTokens: number; requests: number }>;
  tokenTotals: { promptTokens: number; completionTokens: number; totalTokens: number; requests: number };
};

export function DashboardReports({ dbOrderCount }: { dbOrderCount: number | null }) {
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const analytics = useMemo(() => getDashboardAnalytics(), []);
  const maxDwell = useMemo(
    () => Math.max(...analytics.pageDwell.map((p) => p.avgSeconds), 1),
    [analytics.pageDwell],
  );

  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    setHydrated(true);
    void (async () => {
      try {
        const res = await fetch("/api/orders-demo", { cache: "no-store" });
        const j = (await res.json()) as { ok?: boolean; orders?: OrderRow[] };
        if (j.ok && j.orders) setOrders(j.orders);
      } catch {
        setOrders([]);
      }
    })();
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const j = await res.json();
        if (j.ok) setStats(j as DashboardStats);
      } catch {
        // ignore
      }
    })();
  }, []);

  const orderStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let revenue = 0;
    for (const o of orders) {
      const s = normalizeStatus(o.status);
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      if (s !== "cancelled") revenue += o.total_cents;
    }
    return {
      total: orders.length,
      revenue,
      byStatus,
      recent: orders.slice(0, 5),
    };
  }, [orders]);

  const fmt = (n: number) => hydrated ? n.toLocaleString("fa-IR") : String(n);

  const tokenColors: Record<string, string> = {
    gemini: "#4285F4",
    openrouter: "#FF6B35",
    deepseek: "#4F46E5",
  };

  const tokenPieData = stats
    ? Object.entries(stats.tokenUsage).map(([provider, u]) => ({
        name: provider === "gemini" ? "Gemini" : provider === "openrouter" ? "OpenRouter" : "DeepSeek",
        value: u.totalTokens,
        color: tokenColors[provider] || "#6B7280",
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      {stats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>محصولات</p>
              <p className="mt-2 text-2xl font-black" style={{ color: "var(--accent)" }}>{fmt(stats.products.total)}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {fmt(stats.products.published)} منتشر · {fmt(stats.products.draft)} پیش‌نویس
              </p>
            </div>
            <div className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>نوشته‌ها</p>
              <p className="mt-2 text-2xl font-black" style={{ color: "var(--accent)" }}>{fmt(stats.posts.total)}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {fmt(stats.posts.published)} منتشر · {fmt(stats.posts.draft)} پیش‌نویس
              </p>
            </div>
            <div className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>برگه‌ها</p>
              <p className="mt-2 text-2xl font-black" style={{ color: "var(--accent)" }}>{fmt(stats.pages.total)}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {fmt(stats.pages.published)} منتشر · {fmt(stats.pages.draft)} پیش‌نویس
              </p>
            </div>
            <div className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>درخواست‌های AI</p>
              <p className="mt-2 text-2xl font-black" style={{ color: "var(--accent)" }}>{fmt(stats.tokenTotals.requests)}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {fmt(stats.tokenTotals.totalTokens)} توکن مصرفی
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Surface title="توکن مصرف‌شده به تفکیک سرویس">
              <div className="h-64 w-full">
                {tokenPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tokenPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${fmt(value)}`}
                      >
                        {tokenPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: 8,
                          direction: "rtl",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>هیچ فعالیت AI ثبت نشده است.</p>
                  </div>
                )}
              </div>
            </Surface>

            <Surface title="جزئیات مصرف API">
              <div className="space-y-3">
                {Object.entries(stats.tokenUsage).length > 0 ? (
                  Object.entries(stats.tokenUsage).map(([provider, u]) => (
                    <div key={provider} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm font-bold" style={{ color: tokenColors[provider] || "var(--text)" }}>
                        {provider === "gemini" ? "Google Gemini" : provider === "openrouter" ? "OpenRouter" : "DeepSeek"}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{fmt(u.requests)} درخواست</span>
                        <span>{fmt(u.promptTokens)} توکن ورودی</span>
                        <span>{fmt(u.completionTokens)} توکن خروجی</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>هیچ فعالیت AI ثبت نشده است.</p>
                )}
              </div>
            </Surface>
          </div>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "بازدید صفحه", value: analytics.visits, hint: analytics.periodLabel },
          { label: "سشن", value: analytics.sessions, hint: "جلسات منحصربه‌فرد مرور" },
          {
            label: "میانگین ماندگاری سشن",
            value: formatDuration(analytics.avgSessionSeconds),
            hint: "به ازای هر سشن",
            raw: true,
          },
          {
            label: "بازدیدکننده یکتا",
            value: fmt(analytics.uniqueVisitors),
            hint: `نرخ پرش ${fmt(analytics.bounceRate)}٪`,
            raw: true,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border px-4 py-4"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {k.label}
            </p>
            <p className="mt-2 text-2xl font-black" style={{ color: "var(--accent)" }}>
              {k.raw ? k.value : fmt(k.value as number)}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {k.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface title="روند بازدید و سشن (۷ روز اخیر)">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="visits"
                  name="بازدید"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="سشن"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            داده نمونه برای نمایش گزارش — اتصال به Google Analytics یا Plausible در نسخه بعدی.
          </p>
        </Surface>

        <Surface title="میانگین ماندگاری در هر صفحه">
          <ul className="space-y-3">
            {analytics.pageDwell.map((p: PageDwell) => (
              <li key={p.path}>
                <div className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="font-bold">{p.title}</span>
                  <span style={{ color: "var(--text-muted)" }} dir="ltr">
                    {p.path}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: dwellBarWidth(p.avgSeconds, maxDwell),
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{formatDuration(p.avgSeconds)}</span>
                  <span>{fmt(p.views)} بازدید</span>
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <Surface title="نقشه راه مشتری (Customer Journey)">
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          مسیرهای پرتکرار از ورود تا ثبت سفارش — درصد نسبت به کل ورودها.
        </p>
        <div className="flex flex-col gap-2">
          {analytics.journeys.map((j, i) => (
            <div
              key={`${j.from}-${j.to}-${i}`}
              className="grid items-center gap-3 rounded-lg border px-3 py-2 sm:grid-cols-[1fr_auto_1fr_auto]"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <span className="text-sm font-medium">{j.from}</span>
              <span className="text-center text-lg" style={{ color: "var(--accent)" }}>
                ←
              </span>
              <span className="text-sm font-bold">{j.to}</span>
              <span className="text-xs font-bold sm:text-end" style={{ color: "var(--text-muted)" }}>
                {fmt(j.users)} نفر ({fmt(j.pct)}٪)
              </span>
            </div>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface title="سفارش‌ها">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                سفارش (نمونه محلی)
              </p>
              <p className="text-2xl font-black">{fmt(orderStats.total)}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                درآمد تقریبی
              </p>
              <p className="text-lg font-black">{formatToman(orderStats.revenue, hydrated)}</p>
            </div>
            {dbOrderCount !== null ? (
              <div className="col-span-2 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  پایگاه داده (Drizzle)
                </p>
                  <p className="text-xl font-black">{fmt(dbOrderCount)} ردیف</p>
              </div>
            ) : null}
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["placed", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full border px-2 py-0.5 text-xs font-bold"
                  style={{ borderColor: "var(--border)" }}
                >
                  {statusLabelFa(s)}: {fmt(orderStats.byStatus[s] ?? 0)}
                </span>
              ),
            )}
          </div>
          <Link
            href="/orders"
            className="text-sm font-bold no-underline"
            style={{ color: "var(--accent)" }}
          >
            مدیریت همه سفارش‌ها ←
          </Link>
        </Surface>

        <Surface title="آخرین سفارش‌ها">
          <ul className="space-y-3">
            {orderStats.recent.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <p className="font-mono text-xs font-bold">{o.id}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {o.customer_name ?? "—"} · {formatJalaliDate(o.created_at, { time: true })}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-bold">{formatToman(o.total_cents, hydrated)}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {statusLabelFa(normalizeStatus(o.status))}
                  </p>
                </div>
              </li>
            ))}
            {orderStats.recent.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                سفارشی بارگذاری نشد.
              </p>
            ) : null}
          </ul>
        </Surface>
      </div>

      <Surface title="توزیع مراحل سفارش (نمونه)">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(["placed", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
                (s) => ({
                  stage: statusLabelFa(s),
                  count: orderStats.byStatus[s] ?? 0,
                }),
              )}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="stage" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="تعداد" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Surface>
    </div>
  );
}
