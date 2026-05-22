"use client";

import { formatJalaliDate } from "@repo/shared";
import {
  nextPipelineStatus,
  normalizeStatus,
  ORDER_STAGES,
  ORDER_PIPELINE,
  stageState,
  statusAccent,
  statusLabelFa,
  type OrderStatus,
} from "@/lib/order-stages";
import type { DemoOrderRow, OrderLineItem, StatusHistoryEntry } from "@/server/demo-orders-store";

export type OrderView = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  updated_at?: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_city?: string;
  shipping_address?: string;
  payment_method?: string;
  tracking_code?: string;
  items?: OrderLineItem[];
  status_history?: StatusHistoryEntry[];
  source: "demo" | "supabase";
};

function formatAmountToman(totalCents: number): string {
  return `${Math.round(totalCents / 100).toLocaleString("fa-IR")} تومان`;
}

function itemLineTotal(item: OrderLineItem): number {
  return item.unit_price_cents * item.quantity;
}

function connectorColor(leftStage: OrderStatus, rightStage: OrderStatus, current: OrderStatus): string {
  if (current === "cancelled") return "var(--border)";
  const leftIdx = ORDER_PIPELINE.indexOf(leftStage as (typeof ORDER_PIPELINE)[number]);
  const rightIdx = ORDER_PIPELINE.indexOf(rightStage as (typeof ORDER_PIPELINE)[number]);
  const curIdx = pipelineIndexSafe(current);
  if (curIdx >= rightIdx) return statusAccent(rightStage);
  if (curIdx > leftIdx) return statusAccent(leftStage);
  return "var(--border)";
}

function pipelineIndexSafe(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_PIPELINE.indexOf(status as (typeof ORDER_PIPELINE)[number]);
}

type Props = {
  order: OrderView;
  onAdvance?: (id: string, next: OrderStatus) => void;
  advancing?: boolean;
};

export function OrderCard({ order, onAdvance, advancing }: Props) {
  const status = normalizeStatus(order.status);
  const next = nextPipelineStatus(status);
  const rich = order.source === "demo" && order.items && order.items.length > 0;

  return (
    <article
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <header
        className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>
              {order.id}
            </h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{
                background: `${statusAccent(status)}22`,
                color: statusAccent(status),
              }}
            >
              {statusLabelFa(status)}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            ثبت: {formatJalaliDate(order.created_at, { time: true })}
            {order.updated_at ? ` · آخرین تغییر: ${formatJalaliDate(order.updated_at, { time: true })}` : null}
          </p>
        </div>
        <p className="text-lg font-black" style={{ color: "var(--accent)" }}>
          {formatAmountToman(order.total_cents)}
        </p>
      </header>

      <div className="px-5 py-5">
        <p className="mb-4 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
          مراحل سفارش
        </p>
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <ol className="flex items-start px-2 py-4 sm:px-4">
            {ORDER_STAGES.map((stage, i) => {
              const state = stageState(stage.id, status);
              const done = state === "done";
              const current = state === "current";
              const cancelled = state === "cancelled";
              const prev = i > 0 ? ORDER_STAGES[i - 1]!.id : null;

              return (
                <li key={stage.id} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {prev ? (
                      <span
                        className="h-0.5 flex-1"
                        style={{
                          background: connectorColor(prev, stage.id, status),
                          opacity: cancelled ? 0.35 : 1,
                        }}
                        aria-hidden
                      />
                    ) : (
                      <span className="flex-1" aria-hidden />
                    )}
                    <span
                      className="relative z-10 mx-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background:
                          done || current ? `${statusAccent(stage.id)}22` : "var(--surface)",
                        color:
                          done || current ? statusAccent(stage.id) : "var(--text-muted)",
                        border: `2px solid ${
                          cancelled
                            ? "var(--border)"
                            : done || current
                              ? statusAccent(stage.id)
                              : "var(--border)"
                        }`,
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    {i < ORDER_STAGES.length - 1 ? (
                      <span
                        className="h-0.5 flex-1"
                        style={{
                          background: connectorColor(
                            stage.id,
                            ORDER_STAGES[i + 1]!.id,
                            status,
                          ),
                          opacity: cancelled ? 0.35 : 1,
                        }}
                        aria-hidden
                      />
                    ) : (
                      <span className="flex-1" aria-hidden />
                    )}
                  </div>
                  <span
                    className="mt-2 px-1 text-center text-xs font-bold leading-tight"
                    style={{ color: current ? statusAccent(stage.id) : "var(--text)" }}
                  >
                    {stage.short}
                  </span>
                  <span
                    className="mt-0.5 hidden px-1 text-center text-[10px] leading-snug sm:block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {status === "cancelled" ? (
          <p
            className="mt-4 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
          >
            این سفارش لغو شده و در مسیر ارسال ادامه نمی‌یابد.
          </p>
        ) : null}

        {order.tracking_code && (status === "shipped" || status === "delivered") ? (
          <p className="mt-4 text-sm">
            <span style={{ color: "var(--text-muted)" }}>کد رهگیری: </span>
            <span className="font-mono font-bold" dir="ltr">
              {order.tracking_code}
            </span>
          </p>
        ) : null}
      </div>

      {rich ? (
        <div
          className="grid gap-4 border-t px-5 py-4 md:grid-cols-2"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h3 className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              مشتری و ارسال
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <strong>{order.customer_name}</strong>
              </li>
              <li dir="ltr" className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                {order.customer_phone}
              </li>
              <li>
                {order.shipping_city} — {order.shipping_address}
              </li>
              <li style={{ color: "var(--text-muted)" }}>پرداخت: {order.payment_method}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              اقلام سفارش
            </h3>
            <ul className="mt-2 space-y-2">
              {order.items!.map((item) => (
                <li
                  key={`${item.sku}-${item.name}`}
                  className="flex justify-between gap-2 border-b pb-2 text-sm last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span>
                    {item.name}
                    <span className="mr-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      ×{item.quantity.toLocaleString("fa-IR")}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold">
                    {formatAmountToman(itemLineTotal(item))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="border-t px-5 py-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          جزئیات مشتری و اقلام از پایگاه داده در دسترس نیست — فقط وضعیت و مبلغ نمایش داده می‌شود.
        </p>
      )}

      {order.status_history && order.status_history.length > 0 ? (
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
            تاریخچه وضعیت
          </h3>
          <ul className="mt-2 space-y-2">
            {order.status_history.map((h, i) => (
              <li key={`${h.status}-${h.at}-${i}`} className="flex flex-wrap items-baseline gap-2 text-xs">
                <span
                  className="rounded px-1.5 py-0.5 font-bold"
                  style={{
                    background: `${statusAccent(h.status)}18`,
                    color: statusAccent(h.status),
                  }}
                >
                  {statusLabelFa(h.status)}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {formatJalaliDate(h.at, { time: true })}
                </span>
                {h.note ? <span style={{ color: "var(--text)" }}>— {h.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {order.source === "demo" && onAdvance && next ? (
        <footer
          className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            disabled={advancing}
            onClick={() => onAdvance(order.id, next)}
            className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {advancing ? "در حال به‌روزرسانی…" : `انتقال به «${statusLabelFa(next)}»`}
          </button>
        </footer>
      ) : null}
    </article>
  );
}
