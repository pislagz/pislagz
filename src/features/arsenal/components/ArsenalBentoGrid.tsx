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
/** Max tilt on the primary tile under the cursor. */
const HOVER_TILT_DEG = 9;
/** Subtle Z lift on the primary tile only. */
const HOVER_LIFT_PX = 8;
/** How far past the grid edge the effect stays active (covers inter-tile gaps). */
const HOVER_GRID_PAD_PX = 20;
/** Fly-in progress (0–1) before a tile accepts hover glow/tilt. */
const HOVER_LANDING_START = 0.8;
/** Influence needed to start glowing a tile. */
const HOVER_ON_THRESHOLD = 0.03;
/** Lower threshold while fading out to avoid edge flicker. */
const HOVER_OFF_THRESHOLD = 0.012;
/** Match spotlight opacity transition in CSS. */
const HOVER_FADE_MS = 200;

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
    if (!duration) {
      setCount(target);
      return;
    }
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
function cancelTileHoverFade(tile: HTMLElement) {
  const fadeId = tile.dataset.hoverFadeId;
  if (!fadeId) return;
  window.clearTimeout(Number(fadeId));
  delete tile.dataset.hoverFadeId;
}

function clearTileHover(tile: HTMLElement) {
  cancelTileHoverFade(tile);
  tile.removeAttribute("data-hovered");
  tile.removeAttribute("data-primary");
  tile.style.removeProperty("--tilt-x");
  tile.style.removeProperty("--tilt-y");
  tile.style.removeProperty("--spot-x");
  tile.style.removeProperty("--spot-y");
  tile.style.removeProperty("--spot-opacity");
  tile.style.removeProperty("--lift");
}

function isTileHoverEngaged(tile: HTMLElement) {
  return (
    tile.hasAttribute("data-hovered") ||
    tile.dataset.hoverFadeId !== undefined ||
    Number.parseFloat(tile.style.getPropertyValue("--spot-opacity") || "0") > 0.004
  );
}

/** Fade glow out in place — keeps the last spotlight position until opacity hits 0. */
function resetTileHover(tile: HTMLElement) {
  if (tile.dataset.hoverFadeId) return;

  if (!isTileHoverEngaged(tile)) {
    clearTileHover(tile);
    return;
  }

  tile.removeAttribute("data-primary");
  tile.style.setProperty("--spot-opacity", "0");
  tile.style.setProperty("--tilt-x", "0deg");
  tile.style.setProperty("--tilt-y", "0deg");
  tile.style.setProperty("--lift", "0px");

  tile.dataset.hoverFadeId = String(
    window.setTimeout(() => {
      clearTileHover(tile);
    }, HOVER_FADE_MS),
  );
}

function resetAllTileHovers(grid: HTMLElement, immediate = false) {
  for (const tile of Array.from(grid.children)) {
    if (!(tile instanceof HTMLElement)) continue;
    if (immediate) clearTileHover(tile);
    else resetTileHover(tile);
  }
}

function computeTileTilt(
  dx: number,
  dy: number,
  rect: DOMRect,
  influence: number,
  isPrimary: boolean,
) {
  const weight = Math.pow(influence, 0.95);
  const spill = isPrimary ? 1 : 0.4;
  const tiltY = Math.tanh(dx / (rect.width * 0.5)) * HOVER_TILT_DEG * weight * spill;
  const tiltX = -Math.tanh(dy / (rect.height * 0.5)) * HOVER_TILT_DEG * weight * spill;
  const lift = isPrimary ? weight * HOVER_LIFT_PX : 0;

  return { tiltX, tiltY, lift };
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function getTileLandingFactor(tile: HTMLElement, armedAt: number) {
  const delay = Number.parseFloat(tile.style.getPropertyValue("--fly-delay")) || 0;
  const duration = Number.parseFloat(tile.style.getPropertyValue("--fly-duration")) || 1;
  const progress = Math.min(
    1,
    Math.max(0, (performance.now() - armedAt - delay) / duration),
  );
  if (progress < HOVER_LANDING_START) return 0;
  return smoothstep((progress - HOVER_LANDING_START) / (1 - HOVER_LANDING_START));
}

function isInsideGridBounds(
  grid: HTMLElement,
  clientX: number,
  clientY: number,
  pad: number,
) {
  const rect = grid.getBoundingClientRect();
  return (
    clientX >= rect.left - pad &&
    clientX <= rect.right + pad &&
    clientY >= rect.top - pad &&
    clientY <= rect.bottom + pad
  );
}

export function ArsenalBentoGrid({ items }: { items: ArsenalItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const settledTiles = useRef(0);
  const finalized = useRef(false);
  const armedAtRef = useRef(0);
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
    gridRef.current?.setAttribute("data-settled", "true");
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.dataset.arsenalSettled = "true";
    window.dispatchEvent(new Event("arsenal-grid-settled"));
    // Let Safari finish the last compositor frame before dropping the flying
    // stacking context — avoids a one-frame mask-image flash on all icons.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        delete document.documentElement.dataset.arsenalFlying;
      });
    });
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

    for (const item of items) {
      if (!item.iconSrc) continue;
      const icon = new Image();
      icon.decoding = "async";
      icon.src = item.iconSrc;
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
    armedAtRef.current = performance.now();
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

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !armed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    const updateGridFromPointer = (clientX: number, clientY: number) => {
      const tiles = Array.from(grid.children) as HTMLElement[];
      const gridSettled = grid.getAttribute("data-settled") === "true";
      const candidates: {
        tile: HTMLElement;
        influence: number;
        dx: number;
        dy: number;
        rect: DOMRect;
      }[] = [];

      for (const tile of tiles) {
        const rect = tile.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) {
          resetTileHover(tile);
          continue;
        }

        const landingFactor = gridSettled
          ? 1
          : getTileLandingFactor(tile, armedAtRef.current);
        if (landingFactor < HOVER_ON_THRESHOLD) {
          resetTileHover(tile);
          continue;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const reach = Math.max(rect.width, rect.height) * 1.1 + 72;
        const influence = smoothstep(Math.max(0, 1 - dist / reach)) * landingFactor;
        const minInfluence = isTileHoverEngaged(tile)
          ? HOVER_OFF_THRESHOLD
          : HOVER_ON_THRESHOLD;

        if (influence < minInfluence) {
          resetTileHover(tile);
          continue;
        }

        candidates.push({ tile, influence, dx, dy, rect });
      }

      let primaryTile: HTMLElement | null = null;
      let maxInfluence = 0;
      for (const candidate of candidates) {
        if (candidate.influence > maxInfluence) {
          maxInfluence = candidate.influence;
          primaryTile = candidate.tile;
        }
      }

      for (const { tile, influence, dx, dy, rect } of candidates) {
        cancelTileHoverFade(tile);

        const spotX = ((clientX - rect.left) / rect.width) * 100;
        const spotY = ((clientY - rect.top) / rect.height) * 100;
        const isPrimary = tile === primaryTile && maxInfluence > 0.08;
        const { tiltX, tiltY, lift } = computeTileTilt(dx, dy, rect, influence, isPrimary);

        tile.setAttribute("data-hovered", "true");
        tile.toggleAttribute("data-primary", isPrimary);
        tile.style.setProperty("--spot-x", `${spotX.toFixed(1)}%`);
        tile.style.setProperty("--spot-y", `${spotY.toFixed(1)}%`);
        tile.style.setProperty("--spot-opacity", influence.toFixed(3));
        tile.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        tile.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        tile.style.setProperty("--lift", `${lift.toFixed(1)}px`);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isInsideGridBounds(grid, event.clientX, event.clientY, HOVER_GRID_PAD_PX)) {
        resetAllTileHovers(grid);
        return;
      }

      updateGridFromPointer(event.clientX, event.clientY);
    };

    const onBlur = () => resetAllTileHovers(grid);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onBlur);
      resetAllTileHovers(grid, true);
    };
  }, [armed]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.classList.contains(styles.tileMotion) &&
      event.target.parentElement?.parentElement === gridRef.current
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
            <div className={styles.tileMotion}>
              <div className={styles.tileInteractive}>
                <GlassSurface
                  variant="panel"
                  className={styles.arsenalGlass}
                  active={item.highlighted}
                  effectsEnabled={false}
                >
                  <div className={styles.spotlight} aria-hidden="true" />
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
