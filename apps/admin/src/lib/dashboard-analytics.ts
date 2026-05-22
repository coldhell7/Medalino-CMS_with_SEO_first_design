export type DailyMetric = {
  date: string;
  label: string;
  visits: number;
  sessions: number;
};

export type PageDwell = {
  path: string;
  title: string;
  avgSeconds: number;
  views: number;
};

export type JourneyStep = {
  from: string;
  to: string;
  users: number;
  pct: number;
};

export type DashboardAnalytics = {
  periodLabel: string;
  visits: number;
  sessions: number;
  uniqueVisitors: number;
  avgSessionSeconds: number;
  bounceRate: number;
  daily: DailyMetric[];
  pageDwell: PageDwell[];
  journeys: JourneyStep[];
};

export function getDashboardAnalytics(): DashboardAnalytics {
  return {
    periodLabel: "۳۰ روز گذشته",
    visits: 48210,
    sessions: 31640,
    uniqueVisitors: 22180,
    avgSessionSeconds: 272,
    bounceRate: 38.4,
    daily: [
      { date: "2026-04-20", label: "۲۰ فروردین", visits: 1420, sessions: 980 },
      { date: "2026-04-21", label: "۲۱ فروردین", visits: 1580, sessions: 1040 },
      { date: "2026-04-22", label: "۲۲ فروردین", visits: 1510, sessions: 1010 },
      { date: "2026-04-23", label: "۲۳ فروردین", visits: 1690, sessions: 1120 },
      { date: "2026-04-24", label: "۲۴ فروردین", visits: 1740, sessions: 1150 },
      { date: "2026-04-25", label: "۲۵ فروردین", visits: 1620, sessions: 1080 },
      { date: "2026-04-26", label: "۲۶ فروردین", visits: 1810, sessions: 1190 },
    ],
    pageDwell: [
      { path: "/", title: "صفحه اصلی", avgSeconds: 94, views: 18420 },
      { path: "/products/*", title: "صفحه محصول", avgSeconds: 186, views: 11230 },
      { path: "#featured", title: "منتخب محصولات", avgSeconds: 72, views: 8640 },
      { path: "/blog", title: "مجله سلامت", avgSeconds: 128, views: 5210 },
      { path: "/blog/*", title: "مقاله مجله", avgSeconds: 210, views: 3890 },
      { path: "/p/contact", title: "تماس با ما", avgSeconds: 45, views: 2140 },
      { path: "/checkout", title: "تسویه (نمونه)", avgSeconds: 156, views: 1820 },
    ],
    journeys: [
      { from: "ورود", to: "صفحه اصلی", users: 22180, pct: 100 },
      { from: "صفحه اصلی", to: "لیست محصول", users: 14210, pct: 64 },
      { from: "لیست محصول", to: "صفحه محصول", users: 9860, pct: 44 },
      { from: "صفحه محصول", to: "سبد / تسویه", users: 3180, pct: 14 },
      { from: "سبد / تسویه", to: "ثبت سفارش", users: 2140, pct: 10 },
      { from: "صفحه اصلی", to: "مجله", users: 6240, pct: 28 },
      { from: "مجله", to: "صفحه محصول", users: 2890, pct: 13 },
    ],
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toLocaleString("fa-IR")} ثانیه`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toLocaleString("fa-IR")} دقیقه و ${s.toLocaleString("fa-IR")} ثانیه`;
}
