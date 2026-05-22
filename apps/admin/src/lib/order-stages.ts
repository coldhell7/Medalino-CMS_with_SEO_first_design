export const ORDER_PIPELINE = ["placed", "confirmed", "shipped", "delivered"] as const;

export type OrderStatus = (typeof ORDER_PIPELINE)[number] | "cancelled";

export type OrderStageDef = {
  id: OrderStatus;
  label: string;
  short: string;
};

export const ORDER_STAGES: OrderStageDef[] = [
  { id: "placed", label: "ثبت سفارش", short: "ثبت" },
  { id: "confirmed", label: "تأیید و آماده‌سازی", short: "تأیید" },
  { id: "shipped", label: "ارسال شده", short: "ارسال" },
  { id: "delivered", label: "تحویل به مشتری", short: "تحویل" },
];

export function normalizeStatus(raw: string): OrderStatus {
  const s = raw.toLowerCase().trim();
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (ORDER_PIPELINE.includes(s as (typeof ORDER_PIPELINE)[number])) {
    return s as OrderStatus;
  }
  return "placed";
}

export function statusLabelFa(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    placed: "ثبت‌شده",
    confirmed: "تأیید‌شده",
    shipped: "ارسال‌شده",
    delivered: "تحویل‌شده",
    cancelled: "لغو‌شده",
  };
  return map[status];
}

export function pipelineIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_PIPELINE.indexOf(status as (typeof ORDER_PIPELINE)[number]);
}

export function stageState(
  stageId: OrderStatus,
  current: OrderStatus,
): "done" | "current" | "upcoming" | "cancelled" {
  if (current === "cancelled") return "cancelled";
  const cur = pipelineIndex(current);
  const idx = ORDER_PIPELINE.indexOf(stageId as (typeof ORDER_PIPELINE)[number]);
  if (idx < cur) return "done";
  if (idx === cur) return "current";
  return "upcoming";
}

export function nextPipelineStatus(current: OrderStatus): OrderStatus | null {
  if (current === "cancelled" || current === "delivered") return null;
  const idx = pipelineIndex(current);
  if (idx < 0 || idx >= ORDER_PIPELINE.length - 1) return null;
  return ORDER_PIPELINE[idx + 1] as OrderStatus;
}

export function statusAccent(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    placed: "#0ea5e9",
    confirmed: "#8b5cf6",
    shipped: "#f59e0b",
    delivered: "#059669",
    cancelled: "#dc2626",
  };
  return map[status];
}
