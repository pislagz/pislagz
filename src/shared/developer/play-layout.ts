import { backgroundScaleMultiplier, formatBackgroundScale } from "./home-layout";

export const DEFAULT_PLAY_GAME_SCALE = -15;
export const PLAY_GAME_SCALE_MIN = -50;
export const PLAY_GAME_SCALE_MAX = 50;
export const DEFAULT_PLAY_GAME_OFFSET_Y = 36;
export const PLAY_GAME_OFFSET_MIN = -80;
export const PLAY_GAME_OFFSET_MAX = 120;

export function formatPlayGameOffset(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? "+" : "";
  return `(${sign}${rounded}px)`;
}

export function isPlayGameScaleChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_PLAY_GAME_SCALE;
}

export function isPlayGameOffsetChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_PLAY_GAME_OFFSET_Y;
}

export function hasChangedPlaySettings(scale: number, offsetY: number): boolean {
  return isPlayGameScaleChanged(scale) || isPlayGameOffsetChanged(offsetY);
}

export function formatChangedPlaySettings(scale: number, offsetY: number): string {
  const lines: string[] = [];

  if (isPlayGameScaleChanged(scale)) {
    lines.push(`game scale: ${formatBackgroundScale(scale)}`);
  }

  if (isPlayGameOffsetChanged(offsetY)) {
    lines.push(`game position: ${formatPlayGameOffset(offsetY)}`);
  }

  return lines.join("\n");
}

export function applyPlayLayoutVars(scale: number, offsetY: number) {
  document.documentElement.style.setProperty(
    "--dev-play-game-scale",
    String(backgroundScaleMultiplier(scale)),
  );
  document.documentElement.style.setProperty("--dev-play-game-offset-y", `${offsetY}px`);
}

export function clearPlayLayoutVars() {
  document.documentElement.style.removeProperty("--dev-play-game-scale");
  document.documentElement.style.removeProperty("--dev-play-game-offset-y");
}
