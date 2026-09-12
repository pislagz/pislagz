"use client";

import { useEffect, useRef } from "react";
import { PlayGame } from "../components/PlayGame";
import styles from "./PlayPage.module.css";

export function PlayPage() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overscroll-behavior");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    const forward = (phase: "down" | "move" | "up", event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("footer")) return;
      const canvas = pageRef.current?.querySelector("canvas");
      if (!canvas || event.clientY < canvas.getBoundingClientRect().bottom) return;
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

    const onDown = (event: PointerEvent) => forward("down", event);
    const onMove = (event: PointerEvent) => forward("move", event);
    const onUp = (event: PointerEvent) => forward("up", event);

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section ref={pageRef} className={styles.page}>
      <PlayGame />
    </section>
  );
}
