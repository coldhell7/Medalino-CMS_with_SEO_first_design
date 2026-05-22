import { countOrders } from "@repo/database";
import { DashboardReports } from "@/components/dashboard/DashboardReports";

async function getOrderCount(): Promise<number | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await countOrders();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const orderCount = await getOrderCount();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--text)" }}>
          داشبورد
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          گزارش بازدید، سشن، ماندگاری صفحات، نقشه راه مشتری و وضعیت سفارش‌ها.
        </p>
      </div>
      <DashboardReports dbOrderCount={orderCount} />
    </div>
  );
}
