import { NextResponse } from "next/server";
import {
  getEffectiveDeepSeekApiKey,
  getEffectiveGeminiApiKey,
  getEffectiveOpenRouterApiKey,
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

  const openrouterKey = getEffectiveOpenRouterApiKey();
  const envOr = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  const deepseekKey = getEffectiveDeepSeekApiKey();
  const envDs = Boolean(process.env.DEEPSEEK_API_KEY?.trim());

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
      openrouterModel: settings.openrouterModel || "deepseek/deepseek-chat",
      openrouterBaseUrl: settings.openrouterBaseUrl || "https://openrouter.ai",
      defaultAiProvider: settings.defaultAiProvider || "deepseek",
      contentPrompt: settings.contentPrompt || "",
      productPrompt: settings.productPrompt || "",
    },
    gemini: {
      source: geminiSource,
      configured: Boolean(effective),
      maskedKey: effective ? maskApiKey(effective) : null,
    },
    openrouter: {
      configured: Boolean(openrouterKey),
      source: envOr ? "env" : openrouterKey ? "file" : "none",
      maskedKey: openrouterKey ? maskApiKey(openrouterKey) : null,
      model: settings.openrouterModel || "deepseek/deepseek-chat",
    },
    deepseek: {
      configured: Boolean(deepseekKey),
      source: envDs ? "env" : deepseekKey ? "file" : "none",
      maskedKey: deepseekKey ? maskApiKey(deepseekKey) : null,
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
    if (body.openrouterModel !== undefined) updates.openrouterModel = body.openrouterModel;
    if (body.openrouterBaseUrl !== undefined) updates.openrouterBaseUrl = body.openrouterBaseUrl;
    if (body.defaultAiProvider !== undefined) updates.defaultAiProvider = body.defaultAiProvider as "gemini" | "openrouter" | "deepseek";
    if (body.contentPrompt !== undefined) updates.contentPrompt = body.contentPrompt;
    if (body.productPrompt !== undefined) updates.productPrompt = body.productPrompt;

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
        defaultAiProvider: updated.defaultAiProvider || "deepseek",
      },
      gemini: {
        source: process.env.GEMINI_API_KEY?.trim() ? "env" : "file",
        configured: Boolean(getEffectiveGeminiApiKey()),
        maskedKey: getEffectiveGeminiApiKey() ? maskApiKey(getEffectiveGeminiApiKey()!) : null,
      },
      deepseek: {
        source: process.env.DEEPSEEK_API_KEY?.trim() ? "env" : "file",
        configured: Boolean(getEffectiveDeepSeekApiKey()),
        maskedKey: getEffectiveDeepSeekApiKey() ? maskApiKey(getEffectiveDeepSeekApiKey()!) : null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "خطای نامشخص" },
      { status: 400 },
    );
  }
}
