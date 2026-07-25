import { gotchaPages } from "./render";
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
    ...gotchaPages().map((page) => ({ fileName: page.path, source: page.html })),
  ];
}
