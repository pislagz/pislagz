"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import LiquidGlass from "liquid-glass-react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./GlassSurface.module.css";

type Variant = "dock" | "panel" | "pill";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  active?: boolean;
};

const PRESETS: Record<
  Variant,
  {
    displacementScale: number;
    blurAmount: number;
    saturation: number;
    aberrationIntensity: number;
    elasticity: number;
    cornerRadius: number;
    mode: "standard" | "prominent";
  }
> = {
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
    blurAmount: 0.22,
    saturation: 118,
    aberrationIntensity: 0.55,
    elasticity: 0.08,
    cornerRadius: 100,
    mode: "standard",
  },
};

export function GlassSurface({
  children,
  variant = "dock",
  className,
  active = false,
}: Props) {
  const [ready, setReady] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const preset = PRESETS[variant];
  const displacementScale = active ? preset.displacementScale * 1.28 : preset.displacementScale;
  const blurAmount = active ? preset.blurAmount + 0.04 : preset.blurAmount;
  const saturation = active ? preset.saturation + 28 : preset.saturation;
  const aberrationIntensity = active ? preset.aberrationIntensity + 1.1 : preset.aberrationIntensity;
  const elasticity = active ? Math.min(preset.elasticity, 0.12) : preset.elasticity;

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={[styles.slot, styles[variant], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-ready={ready ? "true" : "false"}
      data-active={active ? "true" : "false"}
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
