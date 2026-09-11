"use client";

import type { PointerEvent } from "react";
import { PlayGame } from "../components/PlayGame";
import styles from "./PlayPage.module.css";

export function PlayPage() {
  const forwardPointer = (
    phase: "down" | "move" | "up",
    event: PointerEvent<HTMLElement>,
  ) => {
    const canvas = event.currentTarget.querySelector("canvas");
    if (!canvas || event.clientY < canvas.getBoundingClientRect().bottom) return;
    if (phase === "down") event.currentTarget.setPointerCapture(event.pointerId);
    window.dispatchEvent(
      new CustomEvent("pong-external-pointer", {
        detail: {
          phase,
          clientX: event.clientX,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
        },
      }),
    );
  };

  return (
    <section
      className={styles.page}
      onPointerDown={(event) => forwardPointer("down", event)}
      onPointerMove={(event) => forwardPointer("move", event)}
      onPointerUp={(event) => forwardPointer("up", event)}
      onPointerCancel={(event) => forwardPointer("up", event)}
    >
      <PlayGame />
    </section>
  );
}
