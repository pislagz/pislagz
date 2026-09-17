"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatPositionAxis, type PositionOffset } from "./home-layout";
import styles from "./PositionJoystick.module.css";

type Props = {
  value: PositionOffset;
  onChange: (value: PositionOffset) => void;
  tabIndex?: number;
};

const MAX_KNOB_TRAVEL_PX = 10;

export function PositionJoystick({ value, onChange, tabIndex = -1 }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, valueX: 0, valueY: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      draggingRef.current = true;
      setActive(true);
      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        valueX: value.x,
        valueY: value.y,
      };

      const pointerId = event.pointerId;

      const onMove = (moveEvent: PointerEvent) => {
        if (!draggingRef.current || moveEvent.pointerId !== pointerId) return;

        const dx = moveEvent.clientX - dragStartRef.current.pointerX;
        const dy = moveEvent.clientY - dragStartRef.current.pointerY;

        onChange({
          x: dragStartRef.current.valueX + dx,
          y: dragStartRef.current.valueY + dy,
        });

        const distance = Math.hypot(dx, dy);
        const scale = distance > MAX_KNOB_TRAVEL_PX ? MAX_KNOB_TRAVEL_PX / distance : 1;
        setKnobOffset({ x: dx * scale, y: dy * scale });
      };

      const onUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        draggingRef.current = false;
        setActive(false);
        setKnobOffset({ x: 0, y: 0 });
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [onChange, value.x, value.y],
  );

  return (
    <div className={styles.control}>
      <div
        ref={padRef}
        className={`${styles.pad} ${active ? styles.padActive : ""}`}
        onPointerDown={onPointerDown}
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
