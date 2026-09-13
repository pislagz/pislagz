"use client";

import type { AnimationEvent, CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GlassSurface } from "@shared/ui/GlassSurface";
import type { ArsenalItem } from "../api";
import styles from "./ArsenalBentoGrid.module.css";

type TileSize = "square" | "wide" | "feature";

const TILE_SIZES: Record<string, TileSize> = {
  react: "feature",
  nextjs: "wide",
  figma: "wide",
  ai: "wide",
  claude: "wide",
  experience: "feature",
  cursor: "wide",
  location: "wide",
  contract: "wide",
  hours: "wide",
  "work-type": "wide",
};

/** Shortest independently randomized tile flight. */
const FLY_MIN_DURATION_MS = 1500;
/** Longest independently randomized tile flight. */
const FLY_MAX_DURATION_MS = 4500;
/** Maximum independently randomized delay before a tile starts moving. */
const FLY_MAX_DELAY_MS = 1200;
/** How far tiles start from their spot, as a multiple of their center offset. */
const FLY_TRAVEL_FACTOR = 1.15;
/** Starting scale for tiles at the grid center... */
const FLY_BASE_SCALE = 1.9;
/** ...growing by up to this much for the outermost tiles. */
const FLY_SCALE_SPREAD = 0.7;
/** Fallback in case some animationend event never fires. */
const FLY_SAFETY_TIMEOUT_MS = FLY_MAX_DURATION_MS + FLY_MAX_DELAY_MS + 500;

function AnimatedValue({
  value,
  armed,
  enabled,
}: {
  value: string;
  armed: boolean;
  enabled: boolean;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const match = enabled ? value.match(/\d+/) : null;
  const target = match ? Number(match[0]) : null;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!armed || target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }

    const tile = valueRef.current?.closest<HTMLElement>(`.${styles.tile}`);
    const duration = Number.parseFloat(
      tile?.style.getPropertyValue("--fly-duration") ?? "0",
    );
    const delay = Number.parseFloat(
      tile?.style.getPropertyValue("--fly-delay") ?? "0",
    );
    const startedAt = performance.now();
    let frame = 0;

    const update = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt - delay) / duration));
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * easedProgress));
      if (progress < 1) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [armed, target]);

  if (target === null || !match) return <>{value}</>;

  return (
    <span ref={valueRef}>
      {value.slice(0, match.index)}
      <span
        className={styles.animatedNumber}
        style={{ "--count-digits": match[0].length } as CSSProperties}
      >
        {count}
      </span>
      {value.slice((match.index ?? 0) + match[0].length)}
    </span>
  );
}

/**
 * iOS-unlock style fly-in: every tile starts oversized and radially pushed
 * away from the grid center, then converges into place. Offsets, scale and
 * stagger are computed from each tile's real position after layout.
 */
export function ArsenalBentoGrid({ items }: { items: ArsenalItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const settledTiles = useRef(0);
  const finalized = useRef(false);

  /**
   * Runs once every tile has landed (or via the safety timeout below).
   * - Restores document overflow, which is clipped during the flight so the
   *   out-of-viewport tiles don't flash a page scrollbar.
   * The tiles intentionally keep their lightweight tinted-glass treatment
   * after settling, avoiding an expensive and visually disruptive second
   * liquid-glass mount.
   */
  const finalize = () => {
    if (finalized.current) return;
    finalized.current = true;
    document.documentElement.style.removeProperty("overflow");
    delete document.documentElement.dataset.arsenalFlying;
    document.documentElement.dataset.arsenalSettled = "true";
    window.dispatchEvent(new Event("arsenal-grid-settled"));
  };

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finalize();
      return () => {
        delete document.documentElement.dataset.arsenalSettled;
      };
    }

    const gridRect = grid.getBoundingClientRect();
    const centerX = gridRect.left + gridRect.width / 2;
    const centerY = gridRect.top + gridRect.height / 2;
    const maxDist = Math.hypot(gridRect.width / 2, gridRect.height / 2) || 1;

    for (const tile of Array.from(grid.children) as HTMLElement[]) {
      const rect = tile.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - centerX;
      const dy = rect.top + rect.height / 2 - centerY;
      const t = Math.hypot(dx, dy) / maxDist;

      tile.style.setProperty("--fly-x", `${(dx * FLY_TRAVEL_FACTOR).toFixed(1)}px`);
      tile.style.setProperty("--fly-y", `${(dy * FLY_TRAVEL_FACTOR).toFixed(1)}px`);
      tile.style.setProperty(
        "--fly-scale",
        (FLY_BASE_SCALE + t * FLY_SCALE_SPREAD).toFixed(2),
      );
      tile.style.setProperty(
        "--fly-delay",
        `${Math.round(Math.random() * FLY_MAX_DELAY_MS)}ms`,
      );
      tile.style.setProperty(
        "--fly-duration",
        `${Math.round(
          FLY_MIN_DURATION_MS +
            Math.random() * (FLY_MAX_DURATION_MS - FLY_MIN_DURATION_MS),
        )}ms`,
      );
    }

    finalized.current = false;
    settledTiles.current = 0;
    document.documentElement.dataset.arsenalFlying = "true";
    // Keep mobile pages scrollable throughout the staggered fly-in. Desktop
    // still clips transient overflow so distant tiles cannot flash scrollbars.
    if (!window.matchMedia("(max-width: 900px)").matches) {
      document.documentElement.style.setProperty("overflow", "clip");
    } else {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overscroll-behavior");
      document.body.style.removeProperty("overscroll-behavior");
    }
    setArmed(true);

    const safety = window.setTimeout(finalize, FLY_SAFETY_TIMEOUT_MS);
    return () => {
      window.clearTimeout(safety);
      document.documentElement.style.removeProperty("overflow");
      delete document.documentElement.dataset.arsenalFlying;
      delete document.documentElement.dataset.arsenalSettled;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.parentElement === gridRef.current
    ) {
      settledTiles.current += 1;
      if (settledTiles.current >= items.length) finalize();
    }
  };

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      data-armed={armed ? "true" : "false"}
      onAnimationEnd={handleAnimationEnd}
    >
      {items.map((item) => {
        const size = TILE_SIZES[item.id] ?? "square";
        return (
          <div
            key={item.id}
            className={`${styles.tile} ${styles[size]}`}
            data-arsenal-id={item.id}
          >
            <GlassSurface
              variant="panel"
              className={styles.arsenalGlass}
              active={item.highlighted}
              effectsEnabled={false}
            >
              <div
                className={[styles.content, styles[`content_${size}`]]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.iconSrc ? (
                  <>
                    <span
                      aria-hidden="true"
                      className={styles.icon}
                      style={
                        {
                          "--arsenal-icon": `url("${item.iconSrc}")`,
                        } as CSSProperties
                      }
                    />
                    <span className={styles.label}>{item.label}</span>
                  </>
                ) : (
                  <div className={styles.metric}>
                    <span className={styles.value}>
                      <AnimatedValue
                        value={item.value ?? ""}
                        armed={armed}
                        enabled={item.id === "experience" || item.id === "hours"}
                      />
                    </span>
                    {item.subtitle ? (
                      <span className={styles.subtitle}>{item.subtitle}</span>
                    ) : null}
                  </div>
                )}
              </div>
            </GlassSurface>
          </div>
        );
      })}
    </div>
  );
}
