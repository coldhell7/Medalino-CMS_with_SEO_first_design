import fs from "node:fs";
import path from "node:path";
import type { OrderStatus } from "@/lib/order-stages";

export type OrderLineItem = {
  name: string;
  sku: string;
  quantity: number;
  unit_price_cents: number;
};

export type StatusHistoryEntry = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type DemoOrderRow = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_city: string;
  shipping_address: string;
  payment_method: string;
  tracking_code?: string;
  items: OrderLineItem[];
  status_history: StatusHistoryEntry[];
};

function daysAgo(n: number, hours = 12): string {
  return new Date(Date.now() - 86400000 * n - 3600000 * hours).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - 3600000 * h).toISOString();
}

const SEED: DemoOrderRow[] = [
  {
    id: "ORD-14021",
    status: "delivered",
    total_cents: 512000 * 100,
    created_at: daysAgo(5),
    updated_at: daysAgo(2, 4),
    customer_name: "سارا محمدی",
    customer_phone: "09121234567",
    shipping_city: "تهران",
    shipping_address: "خیابان ولیعصر، کوچه ۱۲، پلاک ۸",
    payment_method: "درگاه بانکی",
    tracking_code: "IR-9821045531",
    items: [
      { name: "پروبیوتیک ۳۰ میلیارد CFU", sku: "probiotic-30b", quantity: 1, unit_price_cents: 512000 * 100 },
    ],
    status_history: [
      { status: "placed", at: daysAgo(5), note: "ثبت از فروشگاه" },
      { status: "confirmed", at: daysAgo(4, 20) },
      { status: "shipped", at: daysAgo(3, 10), note: "تحویل به پست" },
      { status: "delivered", at: daysAgo(2, 4) },
    ],
  },
  {
    id: "ORD-14022",
    status: "shipped",
    total_cents: 289000 * 100,
    created_at: daysAgo(2),
    updated_at: hoursAgo(6),
    customer_name: "امیر رضایی",
    customer_phone: "09351239876",
    shipping_city: "شیراز",
    shipping_address: "بلوار زند، مجتمع پارس، واحد ۴۰۲",
    payment_method: "کارت به کارت",
    tracking_code: "IR-4412098872",
    items: [
      { name: "نوار تست قند خون (۵۰ عدد)", sku: "glucose-test-strips", quantity: 1, unit_price_cents: 289000 * 100 },
    ],
    status_history: [
      { status: "placed", at: daysAgo(2) },
      { status: "confirmed", at: daysAgo(1, 18) },
      { status: "shipped", at: hoursAgo(6) },
    ],
  },
  {
    id: "ORD-14023",
    status: "confirmed",
    total_cents: 428000 * 100,
    created_at: hoursAgo(8),
    updated_at: hoursAgo(3),
    customer_name: "مریم کریمی",
    customer_phone: "09131112233",
    shipping_city: "اصفهان",
    shipping_address: "خیابان چهارباغ عباسی، پلاک ۲۱",
    payment_method: "درگاه بانکی",
    items: [
      { name: "امگا ۳ پریمیوم", sku: "omega-3-premium", quantity: 1, unit_price_cents: 428000 * 100 },
    ],
    status_history: [
      { status: "placed", at: hoursAgo(8) },
      { status: "confirmed", at: hoursAgo(3), note: "بررسی انبار" },
    ],
  },
  {
    id: "ORD-14024",
    status: "placed",
    total_cents: 198000 * 100,
    created_at: hoursAgo(3),
    updated_at: hoursAgo(3),
    customer_name: "حسین علوی",
    customer_phone: "09217894561",
    shipping_city: "مشهد",
    shipping_address: "بلوار سجاد، بین ۱۵ و ۱۷",
    payment_method: "پرداخت در محل",
    items: [
      { name: "ویتامین D3 دوهزار واحد", sku: "vitamin-d3-2000", quantity: 1, unit_price_cents: 198000 * 100 },
    ],
    status_history: [{ status: "placed", at: hoursAgo(3) }],
  },
  {
    id: "ORD-14025",
    status: "placed",
    total_cents: 730000 * 100,
    created_at: hoursAgo(1),
    updated_at: hoursAgo(1),
    customer_name: "نازنین احمدی",
    customer_phone: "09195556677",
    shipping_city: "تهران",
    shipping_address: "سعادت‌آباد، میدان کاج، برج آسمان",
    payment_method: "درگاه بانکی",
    items: [
      { name: "کرم آبرسان هیالورونیک", sku: "hyaluronic-cream", quantity: 1, unit_price_cents: 365000 * 100 },
      { name: "میکس الکترولیت روزانه", sku: "daily-electrolyte", quantity: 1, unit_price_cents: 256000 * 100 },
      { name: "زینک شلات ۱۵ میلی‌گرم", sku: "zinc-chelate", quantity: 1, unit_price_cents: 142000 * 100 },
    ],
    status_history: [{ status: "placed", at: hoursAgo(1) }],
  },
  {
    id: "ORD-14026",
    status: "cancelled",
    total_cents: 142000 * 100,
    created_at: hoursAgo(5),
    updated_at: hoursAgo(4),
    customer_name: "رضا موسوی",
    customer_phone: "09367891234",
    shipping_city: "کرج",
    shipping_address: "گوهردشت، فاز ۲",
    payment_method: "درگاه بانکی",
    items: [
      { name: "زینک شلات ۱۵ میلی‌گرم", sku: "zinc-chelate", quantity: 1, unit_price_cents: 142000 * 100 },
    ],
    status_history: [
      { status: "placed", at: hoursAgo(5) },
      { status: "cancelled", at: hoursAgo(4), note: "درخواست مشتری" },
    ],
  },
  {
    id: "ORD-14027",
    status: "shipped",
    total_cents: 175000 * 100,
    created_at: daysAgo(1, 6),
    updated_at: hoursAgo(12),
    customer_name: "لیلا جعفری",
    customer_phone: "09127778899",
    shipping_city: "تبریز",
    shipping_address: "خیابان امام، روبروی پارک",
    payment_method: "درگاه بانکی",
    tracking_code: "IR-7733001298",
    items: [
      { name: "ملاتونین ۳ میلی‌گرم", sku: "melatonin-3mg", quantity: 1, unit_price_cents: 175000 * 100 },
    ],
    status_history: [
      { status: "placed", at: daysAgo(1, 6) },
      { status: "confirmed", at: daysAgo(1, 2) },
      { status: "shipped", at: hoursAgo(12) },
    ],
  },
];

function dataPath(): string {
  const dir = path.join(process.cwd(), ".data");
  return path.join(dir, "demo-orders.json");
}

function legacyToRow(raw: Record<string, unknown>): DemoOrderRow | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  const seed = SEED.find((s) => s.id === id);
  if (seed) return { ...seed, status: (raw.status as OrderStatus) ?? seed.status };
  return null;
}

function normalizeRow(raw: unknown): DemoOrderRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items) || !Array.isArray(o.status_history)) {
    return legacyToRow(o);
  }
  return o as DemoOrderRow;
}

export function listDemoOrders(): DemoOrderRow[] {
  const file = dataPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(SEED, null, 2), "utf8");
    return [...SEED];
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    fs.writeFileSync(file, JSON.stringify(SEED, null, 2), "utf8");
    return [...SEED];
  }

  const rows = parsed.map(normalizeRow).filter((r): r is DemoOrderRow => r !== null);
  if (rows.length === 0) {
    fs.writeFileSync(file, JSON.stringify(SEED, null, 2), "utf8");
    return [...SEED];
  }
  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateDemoOrderStatus(id: string, status: OrderStatus): DemoOrderRow | null {
  const orders = listDemoOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;

  const order = orders[idx];
  const now = new Date().toISOString();
  const history = [...order.status_history];
  if (history[history.length - 1]?.status !== status) {
    history.push({ status, at: now });
  }

  const updated: DemoOrderRow = {
    ...order,
    status,
    updated_at: now,
    status_history: history,
    tracking_code:
      status === "shipped" && !order.tracking_code
        ? `IR-${Math.floor(1000000000 + Math.random() * 8999999999)}`
        : order.tracking_code,
  };

  orders[idx] = updated;
  fs.writeFileSync(dataPath(), JSON.stringify(orders, null, 2), "utf8");
  return updated;
}
