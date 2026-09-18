export type GlassVariant = "dock" | "panel" | "pill";
export type GlassMode = "standard" | "polar" | "prominent" | "shader";

export type GlassPreset = {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  mode: GlassMode;
};

export const GLASS_MODES: readonly GlassMode[] = [
  "standard",
  "polar",
  "prominent",
  "shader",
];

/** Developer controls cover the live liquid-glass buttons. Panel/dock stay in code. */
export const USED_GLASS_VARIANTS = ["pill"] as const;
export type UsedGlassVariant = (typeof USED_GLASS_VARIANTS)[number];

export const DEFAULT_GLASS_PRESETS: Record<GlassVariant, GlassPreset> = {
  dock: {
    displacementScale: 36,
    blurAmount: 0.08,
    saturation: 130,
    aberrationIntensity: 1.2,
    elasticity: 0.06,
    cornerRadius: 24,
    mode: "standard",
  },
  panel: {
    displacementScale: 52,
    blurAmount: 0.1,
    saturation: 125,
    aberrationIntensity: 1.6,
    elasticity: 0.01,
    cornerRadius: 28,
    mode: "standard",
  },
  pill: {
    displacementScale: 28,
    blurAmount: 0.6,
    saturation: 200,
    aberrationIntensity: 0.55,
    elasticity: 0.08,
    cornerRadius: 100,
    mode: "standard",
  },
};

export const GLASS_PARAM_RANGES = {
  displacementScale: { min: 0, max: 120, step: 1 },
  blurAmount: { min: 0, max: 0.6, step: 0.01 },
  saturation: { min: 80, max: 200, step: 1 },
  aberrationIntensity: { min: 0, max: 5, step: 0.05 },
  elasticity: { min: 0, max: 0.5, step: 0.01 },
  cornerRadius: { min: 0, max: 100, step: 1 },
} as const;

export type GlassNumericParam = keyof typeof GLASS_PARAM_RANGES;

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

function presetsEqual(current: GlassPreset, fallback: GlassPreset) {
  return (
    nearlyEqual(current.displacementScale, fallback.displacementScale) &&
    nearlyEqual(current.blurAmount, fallback.blurAmount) &&
    nearlyEqual(current.saturation, fallback.saturation) &&
    nearlyEqual(current.aberrationIntensity, fallback.aberrationIntensity) &&
    nearlyEqual(current.elasticity, fallback.elasticity) &&
    nearlyEqual(current.cornerRadius, fallback.cornerRadius) &&
    current.mode === fallback.mode
  );
}

export function hasChangedGlassSettings(
  presets: Record<GlassVariant, GlassPreset>,
): boolean {
  return USED_GLASS_VARIANTS.some(
    (variant) => !presetsEqual(presets[variant], DEFAULT_GLASS_PRESETS[variant]),
  );
}

export function formatDecimal(value: number, digits = 2): string {
  const text = value.toFixed(digits);
  return text.replace(/\.?0+$/, "") || "0";
}

export function formatGlassDisplacement(value: number): string {
  return `${Math.round(value)}`;
}

export function formatGlassBlur(value: number): string {
  return formatDecimal(value, 2);
}

export function formatGlassSaturation(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatGlassAberration(value: number): string {
  return formatDecimal(value, 2);
}

export function formatGlassElasticity(value: number): string {
  return formatDecimal(value, 2);
}

export function formatGlassCornerRadius(value: number): string {
  return `${Math.round(value)}px`;
}

export function formatChangedGlassSettings(
  presets: Record<GlassVariant, GlassPreset>,
): string {
  const lines: string[] = [];

  for (const variant of USED_GLASS_VARIANTS) {
    const current = presets[variant];
    const fallback = DEFAULT_GLASS_PRESETS[variant];
    if (presetsEqual(current, fallback)) continue;

    const parts: string[] = [];
    if (!nearlyEqual(current.displacementScale, fallback.displacementScale)) {
      parts.push(`displacement ${formatGlassDisplacement(current.displacementScale)}`);
    }
    if (!nearlyEqual(current.blurAmount, fallback.blurAmount)) {
      parts.push(`blur ${formatGlassBlur(current.blurAmount)}`);
    }
    if (!nearlyEqual(current.saturation, fallback.saturation)) {
      parts.push(`saturation ${formatGlassSaturation(current.saturation)}`);
    }
    if (!nearlyEqual(current.aberrationIntensity, fallback.aberrationIntensity)) {
      parts.push(`aberration ${formatGlassAberration(current.aberrationIntensity)}`);
    }
    if (!nearlyEqual(current.elasticity, fallback.elasticity)) {
      parts.push(`elasticity ${formatGlassElasticity(current.elasticity)}`);
    }
    if (!nearlyEqual(current.cornerRadius, fallback.cornerRadius)) {
      parts.push(`corner ${formatGlassCornerRadius(current.cornerRadius)}`);
    }
    if (current.mode !== fallback.mode) {
      parts.push(`mode ${current.mode}`);
    }
    if (parts.length) {
      lines.push(`liquid glass ${variant}: ${parts.join(", ")}`);
    }
  }

  return lines.join("\n");
}
