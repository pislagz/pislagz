export type PositionOffset = {
  x: number;
  y: number;
};

export type HomeLayoutKey = "title" | "subtitle" | "cta" | "portrait" | "background";

export type HomeLayoutOffsets = Record<HomeLayoutKey, PositionOffset>;

export const DEFAULT_HOME_LAYOUT_OFFSETS: HomeLayoutOffsets = {
  title: { x: 0, y: 0 },
  subtitle: { x: 0, y: 0 },
  cta: { x: 0, y: 0 },
  portrait: { x: 0, y: 0 },
  background: { x: 0, y: 0 },
};

export const DEFAULT_HOME_BACKGROUND_SCALE = 0;
export const HOME_BACKGROUND_SCALE_MIN = -50;
export const HOME_BACKGROUND_SCALE_MAX = 50;
export const DEFAULT_BIG_HEADER_ENABLED = false;

export const HOME_LAYOUT_OPTIONS: ReadonlyArray<{ key: HomeLayoutKey; label: string }> = [
  { key: "title", label: "title position" },
  { key: "subtitle", label: "subtitle position" },
  { key: "cta", label: "cta position" },
  { key: "portrait", label: "portrait position" },
  { key: "background", label: "background epicenter" },
];

const HOME_LAYOUT_CSS_VARS: Record<Exclude<HomeLayoutKey, "background">, { x: string; y: string }> = {
  title: { x: "--dev-home-title-x", y: "--dev-home-title-y" },
  subtitle: { x: "--dev-home-subtitle-x", y: "--dev-home-subtitle-y" },
  cta: { x: "--dev-home-cta-x", y: "--dev-home-cta-y" },
  portrait: { x: "--dev-home-portrait-x", y: "--dev-home-portrait-y" },
};

export function formatPositionAxis(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded}px`;
}

export function formatBackgroundScale(deltaPercent: number): string {
  const rounded = Math.round(deltaPercent);
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

export function backgroundScaleMultiplier(deltaPercent: number): number {
  return 1 + deltaPercent / 100;
}

export function isHomeBackgroundScaleChanged(scale: number): boolean {
  return Math.round(scale) !== 0;
}

export function isHomeLayoutOffsetChanged(offset: PositionOffset): boolean {
  return Math.round(offset.x) !== 0 || Math.round(offset.y) !== 0;
}

export function hasChangedHomeLayoutOffsets(
  offsets: HomeLayoutOffsets,
  backgroundScale = DEFAULT_HOME_BACKGROUND_SCALE,
): boolean {
  return (
    HOME_LAYOUT_OPTIONS.some((option) => isHomeLayoutOffsetChanged(offsets[option.key])) ||
    isHomeBackgroundScaleChanged(backgroundScale)
  );
}

export function formatChangedHomeLayoutOffsets(
  offsets: HomeLayoutOffsets,
  backgroundScale = DEFAULT_HOME_BACKGROUND_SCALE,
): string {
  const lines = HOME_LAYOUT_OPTIONS.filter((option) => isHomeLayoutOffsetChanged(offsets[option.key]))
    .map((option) => {
      const offset = offsets[option.key];
      return `${option.label}: x: ${formatPositionAxis(offset.x)} y: ${formatPositionAxis(offset.y)}`;
    });

  if (isHomeBackgroundScaleChanged(backgroundScale)) {
    lines.push(`background scale: ${formatBackgroundScale(backgroundScale)}`);
  }

  return lines.join("\n");
}

export function applyHomeLayoutVars(offsets: HomeLayoutOffsets) {
  const root = document.documentElement;
  for (const key of Object.keys(HOME_LAYOUT_CSS_VARS) as Exclude<HomeLayoutKey, "background">[]) {
    const vars = HOME_LAYOUT_CSS_VARS[key];
    const offset = offsets[key];
    root.style.setProperty(vars.x, `${offset.x}px`);
    root.style.setProperty(vars.y, `${offset.y}px`);
  }
}

export function clearHomeLayoutVars() {
  const root = document.documentElement;
  for (const key of Object.keys(HOME_LAYOUT_CSS_VARS) as Exclude<HomeLayoutKey, "background">[]) {
    const vars = HOME_LAYOUT_CSS_VARS[key];
    root.style.removeProperty(vars.x);
    root.style.removeProperty(vars.y);
  }
}
