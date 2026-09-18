export type GlassEngine = "webkit" | "chromium";

export function detectGlassEngine(): GlassEngine {
  if (typeof navigator === "undefined") return "webkit";
  const ua = navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|iPhone|iPad|iPod/i.test(ua)) return "webkit";
  if (/Chrome|Chromium|Edg|OPR|Firefox/i.test(ua)) return "chromium";
  return "webkit";
}

export function markGlassEngine(root: HTMLElement = document.documentElement) {
  root.dataset.glassEngine = detectGlassEngine();
}

export function needsSceneCopyForGlass() {
  return detectGlassEngine() === "chromium";
}
