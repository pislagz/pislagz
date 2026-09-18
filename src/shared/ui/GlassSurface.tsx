"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import LiquidGlass from "liquid-glass-react";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { DEFAULT_GLASS_PRESETS, type GlassVariant } from "@shared/developer/glass-layout";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./GlassSurface.module.css";

type Props = {
  children: ReactNode;
  variant?: GlassVariant;
  className?: string;
  active?: boolean;
  effectsEnabled?: boolean;
};

export function GlassSurface({
  children,
  variant = "dock",
  className,
  active = false,
  effectsEnabled = true,
}: Props) {
  const [ready, setReady] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { glassPresets } = useDeveloperSettings();
  const preset = glassPresets[variant] ?? DEFAULT_GLASS_PRESETS[variant];
  const displacementScale = active ? preset.displacementScale * 1.28 : preset.displacementScale;
  const blurAmount = active ? preset.blurAmount + 0.04 : preset.blurAmount;
  const saturation = active ? preset.saturation + 28 : preset.saturation;
  const aberrationIntensity = active ? preset.aberrationIntensity + 1.1 : preset.aberrationIntensity;
  const elasticity = active ? Math.min(preset.elasticity, 0.12) : preset.elasticity;

  useEffect(() => {
    setReady(effectsEnabled);
  }, [effectsEnabled]);

  return (
    <div
      className={[styles.slot, styles[variant], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-ready={ready ? "true" : "false"}
      data-active={active ? "true" : "false"}
      data-effects-enabled={effectsEnabled ? "true" : "false"}
    >
      <div className={styles.sizer} aria-hidden={ready} inert={ready}>
        {children}
      </div>
      {ready ? (
        <LiquidGlass
          displacementScale={reducedMotion ? 0 : displacementScale}
          blurAmount={blurAmount}
          saturation={saturation}
          aberrationIntensity={reducedMotion ? 0 : aberrationIntensity}
          elasticity={reducedMotion ? 0 : elasticity}
          cornerRadius={preset.cornerRadius}
          mode={preset.mode}
          padding="0"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </LiquidGlass>
      ) : null}
    </div>
  );
}
