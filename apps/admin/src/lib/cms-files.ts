import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CmsMedia, CmsPage, CmsPost, CmsProduct } from "@repo/cms/types";

const CMS_CONTENT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../packages/cms/content",
);

function resolveContentFile(
  name: "posts.json" | "pages.json" | "media.json" | "products.json",
): string {
  return path.join(CMS_CONTENT_DIR, name);
}

export function readPosts(): CmsPost[] {
  const raw = fs.readFileSync(resolveContentFile("posts.json"), "utf8");
  return JSON.parse(raw) as CmsPost[];
}

export function writePosts(posts: CmsPost[]): void {
  fs.writeFileSync(resolveContentFile("posts.json"), JSON.stringify(posts, null, 2), "utf8");
}

export function readPages(): CmsPage[] {
  const raw = fs.readFileSync(resolveContentFile("pages.json"), "utf8");
  return JSON.parse(raw) as CmsPage[];
}

export function writePages(pages: CmsPage[]): void {
  fs.writeFileSync(resolveContentFile("pages.json"), JSON.stringify(pages, null, 2), "utf8");
}

export function readMedia(): CmsMedia[] {
  const raw = fs.readFileSync(resolveContentFile("media.json"), "utf8");
  return JSON.parse(raw) as CmsMedia[];
}

export function writeMedia(items: CmsMedia[]): void {
  fs.writeFileSync(resolveContentFile("media.json"), JSON.stringify(items, null, 2), "utf8");
}

export function readProducts(): CmsProduct[] {
  const raw = fs.readFileSync(resolveContentFile("products.json"), "utf8");
  return JSON.parse(raw) as CmsProduct[];
}

export function writeProducts(products: CmsProduct[]): void {
  fs.writeFileSync(resolveContentFile("products.json"), JSON.stringify(products, null, 2), "utf8");
}
