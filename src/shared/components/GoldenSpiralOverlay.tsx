"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { FIBONACCI_SPIRAL_SRC } from "@shared/developer/golden-spiral";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./GoldenSpiralOverlay.module.css";

export function GoldenSpiralOverlay() {
  const { goldenSpiralEnabled, goldenSpiralMirrorX, goldenSpiralMirrorY } = useDeveloperSettings();
  const mobile = useMediaQuery("(max-width: 900px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !goldenSpiralEnabled) return null;

  const mirrorTransform = `scaleX(${goldenSpiralMirrorX ? -1 : 1}) scaleY(${goldenSpiralMirrorY ? -1 : 1})`;
  const stageTransform = mobile
    ? `translate(-50%, -50%) rotate(90deg) ${mirrorTransform}`
    : mirrorTransform;

  return createPortal(
    <div className={styles.overlay} aria-hidden="true">
      <div
        className={`${styles.stage} ${mobile ? styles.stageVertical : ""}`}
        style={{
          transform: stageTransform,
        }}
      >
        <img src={FIBONACCI_SPIRAL_SRC} alt="" className={styles.artwork} />
      </div>
    </div>,
    document.body,
  );
}
