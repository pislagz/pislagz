import type { PositionOffset } from "./home-layout";

export const DEFAULT_RIGHTS_POSITION: PositionOffset = { x: 0, y: 0 };

export function applyRightsLayoutVars(offset: PositionOffset) {
  const root = document.documentElement;
  root.style.setProperty("--dev-rights-x", `${offset.x}px`);
  root.style.setProperty("--dev-rights-y", `${offset.y}px`);
}

export function clearRightsLayoutVars() {
  const root = document.documentElement;
  root.style.removeProperty("--dev-rights-x");
  root.style.removeProperty("--dev-rights-y");
}
