import { NextResponse } from "next/server";

export const runtime = "nodejs";

import fs from "node:fs";
import path from "node:path";

const SEO_FILE = path.join(process.cwd(), ".data", "seo-settings.json");
const DEFAULTS_ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

Sitemap: https://medalino.ir/sitemap.xml`;

function loadRobotsContent(): string {
  try {
    if (!fs.existsSync(SEO_FILE)) return DEFAULTS_ROBOTS;
    const raw = fs.readFileSync(SEO_FILE, "utf8");
    const parsed = JSON.parse(raw) as { robotsTxt?: string };
    return parsed.robotsTxt?.trim() || DEFAULTS_ROBOTS;
  } catch {
    return DEFAULTS_ROBOTS;
  }
}

export async function GET() {
  const content = loadRobotsContent();
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

type ValidationIssue = {
  line: number;
  message: string;
  level: "error" | "warning" | "info";
};

function validateRobotsTxt(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = content.split("\n");

  let hasSitemap = false;
  let hasUserAgent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const lineNum = i + 1;

    if (!line || line.startsWith("#")) continue;

    if (line.toLowerCase().startsWith("user-agent")) {
      hasUserAgent = true;
    }

    if (line.toLowerCase().startsWith("sitemap")) {
      hasSitemap = true;
      const urlMatch = line.match(/sitemap:\s*(.+)$/i);
      if (urlMatch) {
        const url = urlMatch[1]!.trim();
        if (!url.startsWith("http")) {
          issues.push({
            line: lineNum,
            message: "آدرس sitemap باید با http شروع شود",
            level: "error",
          });
        } else {
          try {
            new URL(url);
          } catch {
            issues.push({
              line: lineNum,
              message: "آدرس sitemap معتبر نیست",
              level: "error",
            });
          }
        }
      }
    }

    if (line.toLowerCase().startsWith("disallow")) {
      const pathMatch = line.match(/disallow:\s*(.+)$/i);
      if (pathMatch) {
        const p = pathMatch[1]!.trim();
        if (p === "") {
          issues.push({
            line: lineNum,
            message: "Disallow خالی به معنی اجازه دسترسی کامل است",
            level: "info",
          });
        }
      }
    }

    if (!line.includes(":")) {
      issues.push({
        line: lineNum,
        message: `خط نامعتبر: "${line}"`,
        level: "error",
      });
    }
  }

  if (!hasUserAgent) {
    issues.push({
      line: 0,
      message: "حداقل یک User-agent تعریف نشده است",
      level: "error",
    });
  }

  if (!hasSitemap) {
    issues.push({
      line: 0,
      message: "آدرس sitemap تعریف نشده است",
      level: "warning",
    });
  }

  return issues;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { content?: string };
    if (!body.content) {
      return NextResponse.json({ ok: false, message: "محتوای robots.txt الزامی است" }, { status: 400 });
    }

    const issues = validateRobotsTxt(body.content);
    const hasErrors = issues.some((i) => i.level === "error");

    return NextResponse.json({
      ok: true,
      valid: !hasErrors,
      issues,
      errorCount: issues.filter((i) => i.level === "error").length,
      warningCount: issues.filter((i) => i.level === "warning").length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
