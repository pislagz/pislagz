"use client";

import {
  GLASS_MODES,
  GLASS_PARAM_RANGES,
  USED_GLASS_VARIANTS,
  formatGlassAberration,
  formatGlassBlur,
  formatGlassCornerRadius,
  formatGlassDisplacement,
  formatGlassElasticity,
  formatGlassSaturation,
  type GlassMode,
  type GlassNumericParam,
  type GlassPreset,
  type GlassVariant,
  type UsedGlassVariant,
} from "./glass-layout";
import { ScaleSlider } from "./ScaleSlider";
import styles from "../components/DeveloperMenu.module.css";

type Props = {
  presets: Record<GlassVariant, GlassPreset>;
  onChangeParam: (
    variant: UsedGlassVariant,
    key: GlassNumericParam,
    value: number,
  ) => void;
  onChangeMode: (variant: UsedGlassVariant, mode: GlassMode) => void;
  tabIndex: number;
};

const PARAMS: {
  key: GlassNumericParam;
  label: string;
  format: (value: number) => string;
}[] = [
  {
    key: "displacementScale",
    label: "displacement",
    format: formatGlassDisplacement,
  },
  { key: "blurAmount", label: "blur", format: formatGlassBlur },
  { key: "saturation", label: "saturation", format: formatGlassSaturation },
  {
    key: "aberrationIntensity",
    label: "aberration",
    format: formatGlassAberration,
  },
  { key: "elasticity", label: "elasticity", format: formatGlassElasticity },
  {
    key: "cornerRadius",
    label: "corner radius",
    format: formatGlassCornerRadius,
  },
];

export function GlassPresetControls({
  presets,
  onChangeParam,
  onChangeMode,
  tabIndex,
}: Props) {
  return (
    <div className={styles.positionRows}>
      {USED_GLASS_VARIANTS.map((variant) => {
        const preset = presets[variant];
        return (
          <div key={variant} className={styles.glassVariantBlock}>
            {PARAMS.map((param) => {
              const range = GLASS_PARAM_RANGES[param.key];
              return (
                <div key={param.key} className={styles.positionRow}>
                  <span className={styles.positionLabel}>{param.label}</span>
                  <ScaleSlider
                    value={preset[param.key]}
                    onChange={(value) => onChangeParam(variant, param.key, value)}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    formatReadout={param.format}
                    ariaLabel={`Adjust ${variant} glass ${param.label}`}
                    tabIndex={tabIndex}
                  />
                </div>
              );
            })}
            <div className={styles.glassModeRow}>
              <span className={styles.positionLabel}>mode</span>
              <div className={styles.glassModeChips}>
                {GLASS_MODES.map((mode) => {
                  const selected = preset.mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={`${styles.glassModeChip} ${
                        selected ? styles.glassModeChipActive : ""
                      }`}
                      aria-pressed={selected}
                      onClick={() => onChangeMode(variant, mode)}
                      tabIndex={tabIndex}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
