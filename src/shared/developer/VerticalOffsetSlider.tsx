"use client";

import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { formatContactOrOffset } from "./contact-layout";
import styles from "./VerticalOffsetSlider.module.css";

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

export function VerticalOffsetSlider({
  value,
  onChange,
  min,
  max,
  formatReadout = formatContactOrOffset,
  ariaLabel = "Adjust vertical distance",
  tabIndex = -1,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [active, setActive] = useState(false);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      if (rect.height < 1) return;

      const ratio = clamp((clientY - rect.top) / rect.height, 0, 1);
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
      updateFromClientY(event.clientY);
    },
    [updateFromClientY],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateFromClientY(event.clientY);
    },
    [updateFromClientY],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setActive(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const thumbTop = `${valueToPercent(value, min, max)}%`;

  return (
    <div className={styles.control}>
      <div
        ref={trackRef}
        className={`${styles.track} ${active ? styles.trackActive : ""}`}
        style={{ "--thumb-top": thumbTop } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-orientation="vertical"
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
