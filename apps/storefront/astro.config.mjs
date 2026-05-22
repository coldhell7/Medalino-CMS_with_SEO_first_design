import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsContent = path.join(__dirname, "../../packages/cms/content");

const require = createRequire(import.meta.url);
const vazirmatnCss = path.join(
  path.dirname(require.resolve("@fontsource-variable/vazirmatn/package.json")),
  "index.css",
);

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://localhost:4321",
  devToolbar: {
    enabled: false,
  },
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        if (item.url.includes("/products/")) {
          item.priority = 0.8;
          item.changefreq = "weekly";
        } else if (item.url.endsWith("/")) {
          item.priority = 1.0;
          item.changefreq = "daily";
        }
        return item;
      },
    }),
  ],
  vite: {
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "vazirmatn-font.css": vazirmatnCss,
        "@repo/cms/content/posts.json": path.join(cmsContent, "posts.json"),
        "@repo/cms/content/pages.json": path.join(cmsContent, "pages.json"),
        "@repo/cms/content/media.json": path.join(cmsContent, "media.json"),
        "@repo/cms/content/products.json": path.join(cmsContent, "products.json"),
      },
    },
    optimizeDeps: {
      include: [
        "@astrojs/react/client.js",
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
      ],
    },
  },
});
