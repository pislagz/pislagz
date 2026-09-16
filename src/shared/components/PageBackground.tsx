"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { backgroundScaleMultiplier } from "@shared/developer/home-layout";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { CRYSTAL_PALETTES, type CrystalPalette } from "./crystal-palettes";
import styles from "./PageBackground.module.css";

type FieldHandle = {
  destroy: () => void;
  setReducedMotion: (value: boolean) => void;
  setPalette: (palette: CrystalPalette) => void;
  setEpicenterOffset: (offset: { x: number; y: number }) => void;
  setEpicenterScale: (scale: number) => void;
};

function paletteForPath(pathname: string): CrystalPalette {
  if (pathname.startsWith("/arsenal")) return CRYSTAL_PALETTES.arsenal;
  if (pathname.startsWith("/play")) return CRYSTAL_PALETTES.play;
  if (pathname.startsWith("/resume")) return CRYSTAL_PALETTES.resume;
  if (pathname.startsWith("/hire-me")) return CRYSTAL_PALETTES.hire;
  return CRYSTAL_PALETTES.home;
}

export function PageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<FieldHandle | null>(null);
  const paletteRef = useRef<CrystalPalette>(CRYSTAL_PALETTES.home);
  const pathname = usePathname();
  const palette = paletteForPath(pathname);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { homeLayoutOffsets, homeBackgroundScale } = useDeveloperSettings();
  const [canvasReady, setCanvasReady] = useState(false);
  paletteRef.current = palette;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    import("./crystal-field").then(({ createCrystalField }) => {
      if (cancelled || !canvas.isConnected) return;
      const field = createCrystalField(canvas, {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        palette: paletteRef.current,
        onReady: () => setCanvasReady(true),
      });
      fieldRef.current = field;
    }).catch(() => {
      canvas.dataset.fallback = "true";
    });

    return () => {
      cancelled = true;
      fieldRef.current?.destroy();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    fieldRef.current?.setPalette(palette);
  }, [palette]);

  useEffect(() => {
    if (pathname !== "/") {
      fieldRef.current?.setEpicenterOffset({ x: 0, y: 0 });
      fieldRef.current?.setEpicenterScale(1);
      return;
    }
    fieldRef.current?.setEpicenterOffset(homeLayoutOffsets.background);
    fieldRef.current?.setEpicenterScale(backgroundScaleMultiplier(homeBackgroundScale));
  }, [pathname, homeLayoutOffsets.background, homeBackgroundScale]);

  return (
    <div className={styles.root} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${canvasReady ? styles.canvasReady : ""}`}
      />
    </div>
  );
}
