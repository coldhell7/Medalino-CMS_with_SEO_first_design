import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    const existing = request.cookies.get("admin_session")?.value ?? "";
    if (existing && (await verifySessionValue(existing))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/auth/login")) return NextResponse.next();
  if (pathname.startsWith("/api/auth/logout")) return NextResponse.next();
  if (pathname.startsWith("/api/settings")) return NextResponse.next();
  if (pathname.startsWith("/api/favicon")) return NextResponse.next();
  if (pathname.startsWith("/api/homepage")) return NextResponse.next();
  if (pathname.startsWith("/api/cms")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/sitemap")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/robots")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/analyze")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/keywords")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/og-preview")) return NextResponse.next();
  if (pathname.startsWith("/api/seo/webp-convert")) return NextResponse.next();
  if (pathname.startsWith("/api/indexing")) return NextResponse.next();

  const token = request.cookies.get("admin_session")?.value ?? "";
  if (!token || !(await verifySessionValue(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname === "/" ? "/dashboard" : pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
