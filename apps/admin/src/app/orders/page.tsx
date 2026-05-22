"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Surface } from "@repo/ui/react";
import { OrderCard, type OrderView } from "@/components/orders/OrderCard";
import { normalizeStatus, statusLabelFa, type OrderStatus } from "@/lib/order-stages";
import type { DemoOrderRow } from "@/server/demo-orders-store";

type LoadMode = "supabase" | "local" | "idle";

type SupabaseOrderRow = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
};

type FilterKey = "all" | OrderStatus | "active";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "active", label: "در جریان" },
  { key: "placed", label: "ثبت‌شده" },
  { key: "confirmed", label: "تأیید‌شده" },
  { key: "shipped", label: "ارسال‌شده" },
  { key: "delivered", label: "تحویل‌شده" },
  { key: "cancelled", label: "لغو‌شده" },
];

function statusLabel(mode: LoadMode, raw: string): string {
  if (raw === "idle") return "آماده";
  if (raw === "loading") return "در حال بارگذاری…";
  if (raw === "live") return mode === "supabase" ? "زنده — اتصال به سرور" : "نمونهٔ محلی — به‌روزرسانی دوره‌ای";
  if (raw.startsWith("error:")) return `خطا: ${raw.slice(6)}`;
  return raw;
}

function demoToView(row: DemoOrderRow): OrderView {
  return { ...row, source: "demo" };
}

function supabaseToView(row: SupabaseOrderRow): OrderView {
  return {
    id: row.id,
    status: normalizeStatus(row.status),
    total_cents: row.total_cents,
    created_at: row.created_at,
    source: "supabase",
  };
}

function matchesFilter(order: OrderView, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "active") {
    return order.status !== "delivered" && order.status !== "cancelled";
  }
  return order.status === filter;
}

export default function OrdersPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const [orders, setOrders] = useState<OrderView[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [mode, setMode] = useState<LoadMode>("idle");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/orders-demo", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; orders?: DemoOrderRow[]; message?: string };
      if (!res.ok || !json.ok) {
        setStatus(`error:${json.message ?? res.statusText}`);
        setOrders([]);
        return;
      }
      setOrders((json.orders ?? []).map(demoToView));
      setStatus("live");
    } catch (e) {
      setStatus(`error:${e instanceof Error ? e.message : String(e)}`);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      setMode("supabase");
      let channel: RealtimeChannel | undefined;

      const load = async () => {
        setStatus("loading");
        const { data, error } = await supabase
          .from("orders")
          .select("id,status,total_cents,created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          setStatus(`error:${error.message}`);
          return;
        }
        setOrders(((data as SupabaseOrderRow[]) ?? []).map(supabaseToView));
        setStatus("live");
      };

      void load();

      channel = supabase
        .channel("orders-feed")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
          void load();
        })
        .subscribe();

      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }

    setMode("local");
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      if (cancelled) return;
      await loadLocal();
    };

    void tick();
    timer = setInterval(() => void tick(), 12000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [supabase, loadLocal]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      active: 0,
      placed: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
      if (o.status !== "delivered" && o.status !== "cancelled") counts.active += 1;
    }
    return counts;
  }, [orders]);

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o, filter)),
    [orders, filter],
  );

  const advanceStatus = async (id: string, next: OrderStatus) => {
    setAdvancingId(id);
    try {
      const res = await fetch(`/api/orders-demo/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) return;
      await loadLocal();
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">سفارش‌ها</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {supabase
            ? "هر سفارش با مراحل ثبت، تأیید، ارسال و تحویل نمایش داده می‌شود. داده از Supabase به‌صورت زنده به‌روز می‌شود."
            : "نمای کامل سفارش‌ها با مراحل، مشتری، اقلام و تاریخچه. در حالت نمونه می‌توانید وضعیت را به مرحلهٔ بعد منتقل کنید."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "کل سفارش‌ها", value: stats.all, color: "var(--text)" },
          { label: "در جریان", value: stats.active, color: "#0ea5e9" },
          { label: "تحویل‌شده", value: stats.delivered, color: "#059669" },
          { label: "لغو‌شده", value: stats.cancelled, color: "#dc2626" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-black" style={{ color: s.color }}>
              {s.value.toLocaleString("fa-IR")}
            </p>
          </div>
        ))}
      </div>

      <Surface title="فیلتر و وضعیت اتصال">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {statusLabel(mode, status)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? stats.all
                : f.key === "active"
                  ? stats.active
                  : (stats[f.key] ?? 0);
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="rounded-full border px-3 py-1.5 text-xs font-bold transition"
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  background: active ? "var(--accent)" : "var(--bg)",
                  color: active ? "var(--accent-foreground)" : "var(--text)",
                }}
              >
                {f.label}
                <span className="mr-1 opacity-80">({count.toLocaleString("fa-IR")})</span>
              </button>
            );
          })}
        </div>
      </Surface>

      <div className="flex flex-col gap-5">
        {filtered.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAdvance={mode === "local" ? advanceStatus : undefined}
            advancing={advancingId === order.id}
          />
        ))}
        {filtered.length === 0 ? (
          <Surface title="بدون نتیجه">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {status === "loading"
                ? "در حال خواندن سفارش‌ها…"
                : status.startsWith("error:")
                  ? "خطا در بارگذاری. جزئیات در بخش وضعیت اتصال."
                  : filter === "all"
                    ? "هنوز سفارشی ثبت نشده."
                    : `سفارشی با وضعیت «${filter === "active" ? "در جریان" : statusLabelFa(filter as OrderStatus)}» نیست.`}
            </p>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
