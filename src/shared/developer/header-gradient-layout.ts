import { formatPositionAxis, type PositionOffset } from "./home-layout";

export const DEFAULT_DYNAMIC_HEADER_GLOW_ENABLED = false;
export const DEFAULT_HEADER_GRADIENT_COLOR_A = "#ce03ff";
export const DEFAULT_HEADER_GRADIENT_COLOR_B = "#4503ff";
export const DEFAULT_HEADER_GRADIENT_DIRECTION: PositionOffset = { x: 0, y: 100 };

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6);
  const int = Number.parseInt(value, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function normalizeHexColor(value: string) {
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return DEFAULT_HEADER_GRADIENT_COLOR_A;

  const raw = match[1];
  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : raw;

  return `#${expanded.toLowerCase()}`;
}

export function directionToGradientAngle(direction: PositionOffset): number {
  if (direction.x === 0 && direction.y === 0) return 180;
  return (Math.atan2(direction.y, direction.x) * 180) / Math.PI + 90;
}

export function buildHeaderGradient(
  colorA: string,
  colorB: string,
  direction: PositionOffset,
): string {
  const angle = directionToGradientAngle(direction);
  return `linear-gradient(${angle}deg, ${normalizeHexColor(colorA)} 0%, ${normalizeHexColor(colorB)} 100%)`;
}

export function buildHeaderGlowFilter(colorA: string, colorB: string): string {
  const a = hexToRgb(normalizeHexColor(colorA));
  const b = hexToRgb(normalizeHexColor(colorB));
  const mixR = Math.round((a.r + b.r) / 2);
  const mixG = Math.round((a.g + b.g) / 2);
  const mixB = Math.round((a.b + b.b) / 2);

  return [
    `drop-shadow(0 0 8px rgba(${a.r},${a.g},${a.b},0.22))`,
    `drop-shadow(0 0 18px rgba(${b.r},${b.g},${b.b},0.14))`,
    `drop-shadow(0 2px 28px rgba(${mixR},${mixG},${mixB},0.16))`,
  ].join(" ");
}

export function isDynamicHeaderGlowChanged(enabled: boolean): boolean {
  return enabled !== DEFAULT_DYNAMIC_HEADER_GLOW_ENABLED;
}

export function isHeaderGradientColorChanged(color: string, fallback: string): boolean {
  return normalizeHexColor(color) !== normalizeHexColor(fallback);
}

export function isHeaderGradientDirectionChanged(direction: PositionOffset): boolean {
  return (
    Math.round(direction.x) !== DEFAULT_HEADER_GRADIENT_DIRECTION.x ||
    Math.round(direction.y) !== DEFAULT_HEADER_GRADIENT_DIRECTION.y
  );
}

export function hasChangedHeaderGradientSettings(
  glowEnabled: boolean,
  colorA: string,
  colorB: string,
  direction: PositionOffset,
): boolean {
  return (
    isDynamicHeaderGlowChanged(glowEnabled) ||
    isHeaderGradientColorChanged(colorA, DEFAULT_HEADER_GRADIENT_COLOR_A) ||
    isHeaderGradientColorChanged(colorB, DEFAULT_HEADER_GRADIENT_COLOR_B) ||
    isHeaderGradientDirectionChanged(direction)
  );
}

export function formatChangedHeaderGradientSettings(
  glowEnabled: boolean,
  colorA: string,
  colorB: string,
  direction: PositionOffset,
): string {
  const lines: string[] = [];

  if (isDynamicHeaderGlowChanged(glowEnabled)) {
    lines.push(`dynamic header glow: ${glowEnabled ? "on" : "off"}`);
  }

  if (isHeaderGradientColorChanged(colorA, DEFAULT_HEADER_GRADIENT_COLOR_A)) {
    lines.push(`header gradient color a: ${normalizeHexColor(colorA)}`);
  }

  if (isHeaderGradientColorChanged(colorB, DEFAULT_HEADER_GRADIENT_COLOR_B)) {
    lines.push(`header gradient color b: ${normalizeHexColor(colorB)}`);
  }

  if (isHeaderGradientDirectionChanged(direction)) {
    lines.push(
      `header gradient direction: x: ${formatPositionAxis(direction.x)} y: ${formatPositionAxis(direction.y)}`,
    );
  }

  return lines.join("\n");
}

export function applyHeaderGradientVars(
  glowEnabled: boolean,
  colorA: string,
  colorB: string,
  direction: PositionOffset,
) {
  const root = document.documentElement;
  const normalizedA = normalizeHexColor(colorA);
  const normalizedB = normalizeHexColor(colorB);

  root.style.setProperty("--gradient-hero-word", buildHeaderGradient(normalizedA, normalizedB, direction));
  root.dataset.dynamicHeaderGlowEnabled = glowEnabled ? "true" : "false";
  root.style.setProperty(
    "--dev-header-glow-filter",
    glowEnabled ? buildHeaderGlowFilter(normalizedA, normalizedB) : "none",
  );
}

export function clearHeaderGradientVars() {
  const root = document.documentElement;

  root.style.removeProperty("--gradient-hero-word");
  delete root.dataset.dynamicHeaderGlowEnabled;
  root.style.removeProperty("--dev-header-glow-filter");
}

export function normalizeHeaderGradientColor(value: string) {
  return normalizeHexColor(value);
}
