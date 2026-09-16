"use client";

import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { formatBackgroundScale } from "./home-layout";
import styles from "./ScaleSlider.module.css";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  formatReadout?: (value: number) => string;
  ariaLabel?: string;
  tabIndex?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function valueToPercent(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function ScaleSlider({
  value,
  onChange,
  min,
  max,
  formatReadout = formatBackgroundScale,
  ariaLabel = "Adjust scale",
  tabIndex = -1,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [active, setActive] = useState(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      if (rect.width < 1) return;

      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const next = Math.round(min + ratio * (max - min));
      onChange(next);
    },
    [max, min, onChange],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      setActive(true);
      updateFromClientX(event.clientX);
    },
    [updateFromClientX],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateFromClientX(event.clientX);
    },
    [updateFromClientX],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setActive(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const thumbLeft = `${valueToPercent(value, min, max)}%`;

  return (
    <div className={styles.control}>
      <div
        ref={trackRef}
        className={`${styles.track} ${active ? styles.trackActive : ""}`}
        style={{ "--thumb-left": thumbLeft } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatReadout(value)}
        tabIndex={tabIndex}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </div>
      <span className={styles.readout}>{formatReadout(value)}</span>
    </div>
  );
}
