"use client";

import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "../pages/HomePage.module.css";

export function HeroAnimation() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <video
      className={styles.media}
      src="/assets/animation.mp4"
      autoPlay={!reducedMotion}
      loop
      muted
      playsInline
      aria-label="Looping hero animation"
    />
  );
}
