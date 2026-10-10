import { gotchaMarkdown, gotchaPages, renderGotchasIndex } from "./render";
import { GOTCHA_CSS } from "./styles";
import { renderLlmsTxt } from "./llms";

export interface StaticAsset {
  fileName: string;
  source: string;
}

export function staticAssets(): StaticAsset[] {
  return [
    { fileName: "llms.txt", source: renderLlmsTxt() },
    { fileName: "gotchas/gotcha.css", source: GOTCHA_CSS },
    { fileName: "gotchas/index.html", source: renderGotchasIndex() },
    ...gotchaPages().map((page) => ({ fileName: page.path, source: page.html })),
    ...gotchaMarkdown().map((page) => ({ fileName: page.path, source: page.markdown })),
  ];
}
