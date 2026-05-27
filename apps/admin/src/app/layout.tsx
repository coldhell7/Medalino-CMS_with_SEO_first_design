import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "@repo/ui/tokens.css";
import "./globals.css";
import { AdminShell } from "@/components/AdminShell";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSiteSettings();
  return {
    title: `پنل ${settings.siteName}`,
    description: settings.siteDescription,
    icons: {
      icon: settings.faviconDataUrl ? settings.faviconDataUrl : "/favicon.ico",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" data-theme="admin" className="h-full antialiased">
      <body className="min-h-full">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
