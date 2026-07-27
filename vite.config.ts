import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { gotchaPages } from "./src/gotchas/render";
import { GOTCHA_CSS } from "./src/gotchas/styles";
import { renderLlmsTxt } from "./src/gotchas/llms";
import { staticAssets } from "./src/gotchas/emit";

function staticGotchas(): Plugin {
  return {
    name: "cronsense-static-gotchas",
    apply: "build",
    generateBundle() {
      for (const asset of staticAssets()) {
        this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source });
      }
    },
  };
}

function serveGotchas(): Plugin {
  return {
    name: "cronsense-serve-gotchas",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        if (url === "/llms.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(renderLlmsTxt());
          return;
        }
        if (url === "/gotchas/gotcha.css") {
          res.setHeader("Content-Type", "text/css; charset=utf-8");
          res.end(GOTCHA_CSS);
          return;
        }
        const page = gotchaPages().find(
          (candidate) =>
            url === `/gotchas/${candidate.slug}` || url === `/gotchas/${candidate.slug}/`,
        );
        if (page) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(page.html);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    staticGotchas(),
    serveGotchas(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Cronsense",
        short_name: "Cronsense",
        description:
          "The cron checker that tells you when your GitHub Actions workflow will actually fire.",
        start_url: "/",
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#f7f8fa",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "happy-dom",
  },
});
