import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getSiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = getSiteSettings();
  if (settings.faviconDataUrl) {
    return NextResponse.redirect(settings.faviconDataUrl);
  }

  const fallback = path.join(process.cwd(), "public", "favicon.ico");
  if (fs.existsSync(fallback)) {
    const buf = fs.readFileSync(fallback);
    return new NextResponse(buf, {
      headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=86400" },
    });
  }

  const appFallback = path.join(process.cwd(), "src", "app", "favicon.ico");
  if (fs.existsSync(appFallback)) {
    const buf = fs.readFileSync(appFallback);
    return new NextResponse(buf, {
      headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=86400" },
    });
  }

  return new NextResponse("Not Found", { status: 404 });
}
