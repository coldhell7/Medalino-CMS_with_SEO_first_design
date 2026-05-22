import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const STOREFRONT_ROOT = path.join(process.cwd(), "..", "..", "apps", "storefront");
const STOREFRONT_IMAGES = path.join(STOREFRONT_ROOT, "public", "images");
const CMS_CONTENT = path.join(process.cwd(), "..", "..", "packages", "cms", "content");

// Files in storefront src + CMS content that may reference image paths
const REFERENCE_FILES = [
  path.join(STOREFRONT_ROOT, "src", "pages", "index.astro"),
  path.join(CMS_CONTENT, "products.json"),
  path.join(CMS_CONTENT, "posts.json"),
  path.join(CMS_CONTENT, "media.json"),
  path.join(CMS_CONTENT, "homepage-blocks.json"),
];

const SUPPORTED_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".avif"];

export type ImageInfo = {
  relativePath: string;
  absolutePath: string;
  ext: string;
  sizeBytes: number;
  isWebp: boolean;
  webpExists: boolean;
  webpPath: string;
  webpRelativePath: string;
  webpSizeBytes: number | null;
};

function walkDir(dir: string, base: string): ImageInfo[] {
  const results: ImageInfo[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, base));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const isWebp = ext === ".webp";
      if (!SUPPORTED_EXTS.includes(ext) && !isWebp) continue;
      const rel = path.relative(base, full);
      const webpPath = full.replace(/\.[^.]+$/, ".webp");
      const webpRel = path.relative(base, webpPath);
      const webpExists = fs.existsSync(webpPath);
      results.push({
        relativePath: rel,
        absolutePath: full,
        ext,
        sizeBytes: fs.statSync(full).size,
        isWebp,
        webpExists,
        webpPath,
        webpRelativePath: webpRel,
        webpSizeBytes: webpExists ? fs.statSync(webpPath).size : null,
      });
    }
  }
  return results;
}

/**
 * Replace all occurrences of oldPath with newPath in reference files.
 * e.g. "/images/products/omega-3.jpg" → "/images/products/omega-3.webp"
 */
function updateReferences(oldRelative: string, newRelative: string): string[] {
  // Convert OS path separators to URL slashes
  const oldUrl = "/" + oldRelative.replace(/\\/g, "/");
  const newUrl = "/" + newRelative.replace(/\\/g, "/");
  const updated: string[] = [];

  for (const file of REFERENCE_FILES) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    if (!content.includes(oldUrl)) continue;
    fs.writeFileSync(file, content.replaceAll(oldUrl, newUrl), "utf8");
    updated.push(path.relative(process.cwd(), file));
  }
  return updated;
}

// GET — list all images
export async function GET() {
  try {
    const images = walkDir(STOREFRONT_IMAGES, STOREFRONT_IMAGES);
    return NextResponse.json({ ok: true, images, baseDir: STOREFRONT_IMAGES });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE — remove all orphan .webp files that sit next to their original (cleanup)
export async function DELETE() {
  try {
    const images = walkDir(STOREFRONT_IMAGES, STOREFRONT_IMAGES);
    const removed: string[] = [];
    for (const img of images) {
      // Only delete .webp files that have a corresponding original still present
      if (img.isWebp) {
        const hasOriginal = SUPPORTED_EXTS.some((ext) =>
          fs.existsSync(img.absolutePath.replace(/\.webp$/, ext)),
        );
        if (hasOriginal) {
          fs.unlinkSync(img.absolutePath);
          removed.push(img.relativePath);
        }
      }
    }
    return NextResponse.json({ ok: true, removed, count: removed.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST — convert images
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode: "single" | "all";
      filePath?: string;
      quality?: number;
      /**
       * "replace"  — rename .webp to original filename (hero.webp → hero.jpg), delete old file
       * "alongside" — keep both files side by side (default)
       * "webp-only" — save as .webp, delete original, update all references to .webp
       */
      strategy?: "replace" | "alongside" | "webp-only";
    };

    const quality = Math.min(100, Math.max(1, body.quality ?? 82));
    const strategy = body.strategy ?? "alongside";
    const images = walkDir(STOREFRONT_IMAGES, STOREFRONT_IMAGES);

    const targets =
      body.mode === "single"
        ? images.filter((img) => img.relativePath === body.filePath && !img.isWebp)
        : images.filter((img) => !img.isWebp);

    // For replace/webp-only strategies, re-process even if .webp already exists
    // For alongside, skip already-converted ones
    const toProcess = targets.filter((img) => {
      if (strategy === "alongside") return !img.webpExists;
      return true; // replace & webp-only always re-process
    });

    if (toProcess.length === 0) {
      return NextResponse.json({ ok: true, results: [], message: "هیچ تصویری برای تبدیل یافت نشد." });
    }

    const results: {
      file: string;
      outputFile: string;
      ok: boolean;
      originalSize: number;
      webpSize: number | null;
      saving: number | null;
      savingPct: number | null;
      referencesUpdated: string[];
      error?: string;
    }[] = [];

    for (const img of toProcess) {
      try {
        const webpBuffer = await sharp(img.absolutePath)
          .webp({ quality, effort: 4 })
          .toBuffer();

        const webpSize = webpBuffer.byteLength;
        const saving = img.sizeBytes - webpSize;
        const savingPct = Math.round((saving / img.sizeBytes) * 100);
        let outputFile = img.webpRelativePath;
        let referencesUpdated: string[] = [];

        if (strategy === "alongside") {
          // Just write .webp next to original
          fs.writeFileSync(img.webpPath, webpBuffer);

        } else if (strategy === "webp-only") {
          // Write .webp, delete original, update all references from .jpg → .webp
          fs.writeFileSync(img.webpPath, webpBuffer);
          fs.unlinkSync(img.absolutePath);
          referencesUpdated = updateReferences(img.relativePath, img.webpRelativePath);
          outputFile = img.webpRelativePath;

        } else if (strategy === "replace") {
          // Write webp content but keep the ORIGINAL filename (hero.jpg stays hero.jpg but is now webp data)
          // This is transparent — no path changes needed anywhere
          fs.writeFileSync(img.absolutePath, webpBuffer);
          // Remove the separate .webp file if it already existed
          if (fs.existsSync(img.webpPath)) fs.unlinkSync(img.webpPath);
          outputFile = img.relativePath;
        }

        results.push({
          file: img.relativePath,
          outputFile,
          ok: true,
          originalSize: img.sizeBytes,
          webpSize,
          saving,
          savingPct,
          referencesUpdated,
        });
      } catch (e) {
        results.push({
          file: img.relativePath,
          outputFile: img.relativePath,
          ok: false,
          originalSize: img.sizeBytes,
          webpSize: null,
          saving: null,
          savingPct: null,
          referencesUpdated: [],
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
    const totalWebp = results.filter((r) => r.ok).reduce((s, r) => s + (r.webpSize ?? 0), 0);
    const totalSaving = totalOriginal - totalWebp;

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        total: results.length,
        success: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        totalOriginalBytes: totalOriginal,
        totalWebpBytes: totalWebp,
        totalSavingBytes: totalSaving,
        totalSavingPct: totalOriginal > 0 ? Math.round((totalSaving / totalOriginal) * 100) : 0,
        strategy,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
