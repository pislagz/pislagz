export const DEFAULT_ARSENAL_TILT_MAX_DEG = 9;
export const DEFAULT_ARSENAL_TILT_SPILL_PERCENT = 40;
export const DEFAULT_ARSENAL_GLOW_RADIUS_PX = 200;
export const DEFAULT_ARSENAL_GRID_OFFSET_Y = 0;
export const ARSENAL_TILT_MAX_MIN = 0;
export const ARSENAL_TILT_MAX_MAX = 18;
export const ARSENAL_TILT_SPILL_MIN = 0;
export const ARSENAL_TILT_SPILL_MAX = 100;
export const ARSENAL_GLOW_RADIUS_MIN = 80;
export const ARSENAL_GLOW_RADIUS_MAX = 360;
export const ARSENAL_GRID_OFFSET_MIN = -80;
export const ARSENAL_GRID_OFFSET_MAX = 120;

/** Matches the extra reach padding at the default glow radius. */
export const DEFAULT_ARSENAL_GLOW_REACH_PX = 72;

export type ArsenalDevSettings = {
  maxTiltDeg: number;
  spillPercent: number;
  glowRadiusPx: number;
  gridOffsetY: number;
};

export function formatArsenalTiltMax(value: number): string {
  return `${Math.round(value)}°`;
}

export function formatArsenalTiltSpill(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatArsenalGlowRadius(value: number): string {
  return `${Math.round(value)}px`;
}

export function formatArsenalGridOffset(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? "+" : "";
  return `(${sign}${rounded}px)`;
}

export function arsenalGlowReachPx(glowRadiusPx: number): number {
  return glowRadiusPx * (DEFAULT_ARSENAL_GLOW_REACH_PX / DEFAULT_ARSENAL_GLOW_RADIUS_PX);
}

export function isArsenalTiltMaxChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_ARSENAL_TILT_MAX_DEG;
}

export function isArsenalTiltSpillChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_ARSENAL_TILT_SPILL_PERCENT;
}

export function isArsenalGlowRadiusChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_ARSENAL_GLOW_RADIUS_PX;
}

export function isArsenalGridOffsetChanged(value: number): boolean {
  return Math.round(value) !== DEFAULT_ARSENAL_GRID_OFFSET_Y;
}

export function hasChangedArsenalSettings(
  maxTiltDeg: number,
  spillPercent: number,
  glowRadiusPx: number,
  gridOffsetY: number,
): boolean {
  return (
    isArsenalTiltMaxChanged(maxTiltDeg) ||
    isArsenalTiltSpillChanged(spillPercent) ||
    isArsenalGlowRadiusChanged(glowRadiusPx) ||
    isArsenalGridOffsetChanged(gridOffsetY)
  );
}

export function formatChangedArsenalSettings(
  maxTiltDeg: number,
  spillPercent: number,
  glowRadiusPx: number,
  gridOffsetY: number,
): string {
  const lines: string[] = [];

  if (isArsenalTiltMaxChanged(maxTiltDeg)) {
    lines.push(`max tilt: ${formatArsenalTiltMax(maxTiltDeg)}`);
  }

  if (isArsenalTiltSpillChanged(spillPercent)) {
    lines.push(`tilt spill: ${formatArsenalTiltSpill(spillPercent)}`);
  }

  if (isArsenalGlowRadiusChanged(glowRadiusPx)) {
    lines.push(`glow radius: ${formatArsenalGlowRadius(glowRadiusPx)}`);
  }

  if (isArsenalGridOffsetChanged(gridOffsetY)) {
    lines.push(`grid position: ${formatArsenalGridOffset(gridOffsetY)}`);
  }

  return lines.join("\n");
}

export function applyArsenalLayoutVars(glowRadiusPx: number, gridOffsetY: number) {
  document.documentElement.style.setProperty(
    "--dev-arsenal-glow-radius",
    `${glowRadiusPx}px`,
  );
  document.documentElement.style.setProperty(
    "--dev-arsenal-grid-offset-y",
    `${gridOffsetY}px`,
  );
}

export function clearArsenalLayoutVars() {
  document.documentElement.style.removeProperty("--dev-arsenal-glow-radius");
  document.documentElement.style.removeProperty("--dev-arsenal-grid-offset-y");
}

export function applyArsenalGlowRadiusVar(glowRadiusPx: number) {
  document.documentElement.style.setProperty(
    "--dev-arsenal-glow-radius",
    `${glowRadiusPx}px`,
  );
}

export function clearArsenalGlowRadiusVar() {
  document.documentElement.style.removeProperty("--dev-arsenal-glow-radius");
}
