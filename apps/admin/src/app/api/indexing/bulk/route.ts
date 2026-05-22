import { NextResponse } from "next/server";
import { createSign } from "node:crypto";

export const runtime = "nodejs";

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

async function signJwt(payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");
  return `${signingInput}.${signature}`;
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const jwt = await signJwt(payload, privateKey);
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    if (!tokenRes.ok) return null;
    const data = (await tokenRes.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { urls?: string[]; type?: "URL_UPDATED" | "URL_DELETED" };
  const urls = body.urls ?? [];
  const notifType = body.type ?? "URL_UPDATED";

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ ok: false, message: "آرایه urls الزامی است." }, { status: 400 });
  }

  if (urls.length > 100) {
    return NextResponse.json({ ok: false, message: "حداکثر ۱۰۰ URL در هر درخواست مجاز است." }, { status: 400 });
  }

  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return NextResponse.json({
      ok: false,
      message: "اعتبارنامه Indexing API تنظیم نشده.",
      results: urls.map((url) => ({ url, ok: false, message: "اعتبارنامه تنظیم نشده" })),
    });
  }

  const accessToken = await getAccessToken(clientEmail, privateKey);
  if (!accessToken) {
    return NextResponse.json({
      ok: false,
      message: "دریافت توکن دسترسی ناموفق بود.",
      results: urls.map((url) => ({ url, ok: false, message: "توکن دسترسی ناموفق" })),
    });
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, type: notifType }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (res.ok) {
          return { url, ok: true, message: "ارسال موفق" };
        }
        const errMsg = (data.error as Record<string, unknown>)?.message as string | undefined;
        return { url, ok: false, message: errMsg ?? "ارسال ناموفق" };
      } catch (e) {
        return { url, ok: false, message: e instanceof Error ? e.message : "خطا" };
      }
    }),
  );

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: successCount > 0,
    message: `${successCount} از ${urls.length} URL با موفقیت ارسال شد.`,
    results,
  });
}
