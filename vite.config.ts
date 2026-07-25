import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
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
  plugins: [react(), staticGotchas(), serveGotchas()],
  test: {
    environment: "happy-dom",
  },
});
