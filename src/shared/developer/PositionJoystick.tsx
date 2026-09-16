"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatPositionAxis, type PositionOffset } from "./home-layout";
import styles from "./PositionJoystick.module.css";

type Props = {
  value: PositionOffset;
  onChange: (value: PositionOffset) => void;
  tabIndex?: number;
};

const MAX_KNOB_TRAVEL_PX = 8;

export function PositionJoystick({ value, onChange, tabIndex = -1 }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, valueX: 0, valueY: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const pad = padRef.current;
      if (!pad) return;

      pad.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      setActive(true);
      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        valueX: value.x,
        valueY: value.y,
      };
    },
    [value.x, value.y],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;

      const dx = event.clientX - dragStartRef.current.pointerX;
      const dy = event.clientY - dragStartRef.current.pointerY;

      onChange({
        x: dragStartRef.current.valueX + dx,
        y: dragStartRef.current.valueY + dy,
      });

      const distance = Math.hypot(dx, dy);
      const scale = distance > MAX_KNOB_TRAVEL_PX ? MAX_KNOB_TRAVEL_PX / distance : 1;
      setKnobOffset({ x: dx * scale, y: dy * scale });
    },
    [onChange],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div className={styles.control}>
      <div
        ref={padRef}
        className={`${styles.pad} ${active ? styles.padActive : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Adjust position"
        aria-valuetext={`x ${formatPositionAxis(value.x)}, y ${formatPositionAxis(value.y)}`}
        tabIndex={tabIndex}
      >
        <span
          className={styles.knob}
          style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
          aria-hidden="true"
        />
      </div>
      <span className={styles.readout}>
        x: {formatPositionAxis(value.x)} y: {formatPositionAxis(value.y)}
      </span>
    </div>
  );
}
