"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./ArsenalScrollNudge.module.css";

const SCROLL_DISMISS_PX = 10;
const SETTLE_DELAY_MS = 420;
const FADE_OUT_MS = 360;
const CHEVRON_COUNT = 4;

function isPageScrollable() {
  return document.documentElement.scrollHeight > window.innerHeight + 24;
}

export function ArsenalScrollNudge() {
  const mobile = useMediaQuery("(max-width: 900px)");
  const [phase, setPhase] = useState<"hidden" | "visible" | "fading">("hidden");
  const dismissedRef = useRef(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mobile) {
      setPhase("hidden");
      return;
    }

    const reveal = () => {
      if (dismissedRef.current || !isPageScrollable()) return;
      window.setTimeout(() => {
        if (dismissedRef.current || !isPageScrollable()) return;
        setPhase("visible");
      }, SETTLE_DELAY_MS);
    };

    const dismiss = () => {
      if (dismissedRef.current) return;
      if (window.scrollY <= SCROLL_DISMISS_PX) return;
      dismissedRef.current = true;
      window.removeEventListener("scroll", dismiss);
      setPhase("fading");
      fadeTimeoutRef.current = window.setTimeout(
        () => setPhase("hidden"),
        FADE_OUT_MS,
      );
    };

    if (document.documentElement.dataset.arsenalSettled === "true") {
      reveal();
    }

    window.addEventListener("arsenal-grid-settled", reveal);
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => {
      window.removeEventListener("arsenal-grid-settled", reveal);
      window.removeEventListener("scroll", dismiss);
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [mobile]);

  if (!mobile || phase === "hidden") return null;

  return (
    <div
      className={`${styles.nudge} ${phase === "fading" ? styles.fading : ""}`}
      aria-hidden="true"
    >
      <div className={styles.content}>
        <div className={styles.chevrons}>
          {Array.from({ length: CHEVRON_COUNT }, (_, index) => (
            <svg
              key={index}
              className={styles.chevron}
              style={{ "--chevron-index": index } as CSSProperties}
              viewBox="0 0 36 14"
              width="36"
              height="14"
              focusable="false"
            >
              <path
                d="M5 4.5 18 11.5 31 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
        <span className={styles.labelWrap}>
          <span className={styles.label}>scroll down</span>
        </span>
      </div>
    </div>
  );
}
