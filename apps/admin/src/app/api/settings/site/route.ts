import { NextResponse } from "next/server";
import {
  getEffectiveGeminiApiKey,
  getSiteSettings,
  maskApiKey,
  updateSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = getSiteSettings();
  const envGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const effective = getEffectiveGeminiApiKey();

  let geminiSource: "env" | "file" | "none" = "none";
  if (envGemini) geminiSource = "env";
  else if (effective) geminiSource = "file";

  return NextResponse.json({
    ok: true,
    settings: {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteUrl: settings.siteUrl,
      theme: settings.theme,
      accentColor: settings.accentColor,
      faviconDataUrl: settings.faviconDataUrl ? "uploaded" : "",
      bgDark: settings.bgDark,
      bgElevatedDark: settings.bgElevatedDark,
      surfaceDark: settings.surfaceDark,
      textDark: settings.textDark,
      textMutedDark: settings.textMutedDark,
      accentDark: settings.accentDark,
      bgLight: settings.bgLight,
      bgElevatedLight: settings.bgElevatedLight,
      surfaceLight: settings.surfaceLight,
      textLight: settings.textLight,
      textMutedLight: settings.textMutedLight,
      accentLight: settings.accentLight,
    },
    gemini: {
      source: geminiSource,
      configured: Boolean(effective),
      maskedKey: effective ? maskApiKey(effective) : null,
    },
  });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<SiteSettings> & { geminiApiKey?: string };
    const updates: Partial<SiteSettings> = {};

    if (body.siteName !== undefined) updates.siteName = body.siteName;
    if (body.siteDescription !== undefined) updates.siteDescription = body.siteDescription;
    if (body.siteUrl !== undefined) updates.siteUrl = body.siteUrl;
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.accentColor !== undefined) updates.accentColor = body.accentColor;
    if (body.faviconDataUrl !== undefined) updates.faviconDataUrl = body.faviconDataUrl;
    if (body.bgDark !== undefined) updates.bgDark = body.bgDark;
    if (body.bgElevatedDark !== undefined) updates.bgElevatedDark = body.bgElevatedDark;
    if (body.surfaceDark !== undefined) updates.surfaceDark = body.surfaceDark;
    if (body.textDark !== undefined) updates.textDark = body.textDark;
    if (body.textMutedDark !== undefined) updates.textMutedDark = body.textMutedDark;
    if (body.accentDark !== undefined) updates.accentDark = body.accentDark;
    if (body.bgLight !== undefined) updates.bgLight = body.bgLight;
    if (body.bgElevatedLight !== undefined) updates.bgElevatedLight = body.bgElevatedLight;
    if (body.surfaceLight !== undefined) updates.surfaceLight = body.surfaceLight;
    if (body.textLight !== undefined) updates.textLight = body.textLight;
    if (body.textMutedLight !== undefined) updates.textMutedLight = body.textMutedLight;
    if (body.accentLight !== undefined) updates.accentLight = body.accentLight;
    if (body.geminiApiKey !== undefined) updates.geminiApiKey = body.geminiApiKey;

    const updated = updateSiteSettings(updates);

    return NextResponse.json({
      ok: true,
      settings: {
        siteName: updated.siteName,
        siteDescription: updated.siteDescription,
        siteUrl: updated.siteUrl,
        theme: updated.theme,
        accentColor: updated.accentColor,
        faviconDataUrl: updated.faviconDataUrl ? "uploaded" : "",
      },
      gemini: {
        source: process.env.GEMINI_API_KEY?.trim() ? "env" : "file",
        configured: Boolean(getEffectiveGeminiApiKey()),
        maskedKey: getEffectiveGeminiApiKey() ? maskApiKey(getEffectiveGeminiApiKey()!) : null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "خطای نامشخص" },
      { status: 400 },
    );
  }
}
