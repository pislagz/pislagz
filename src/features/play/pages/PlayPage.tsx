"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PlayGame } from "../components/PlayGame";
import styles from "./PlayPage.module.css";

const PONG_QUERY = "(width < 684px)";

function isInteractiveTouchTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("a, button, input, textarea, select, [role='button'], [contenteditable='true']"),
  );
}

export function PlayPage() {
  const pageRef = useRef<HTMLElement>(null);
  const [pong, setPong] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(PONG_QUERY);
    const onChange = () => setPong(media.matches || window.innerWidth < 684);
    onChange();
    media.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  useEffect(() => {
    if (!pong) return;

    document.documentElement.dataset.playMobile = "true";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const onTouchStart = (event: TouchEvent) => {
      if (isInteractiveTouchTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: false });

    return () => {
      delete document.documentElement.dataset.playMobile;
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overscroll-behavior");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
    };
  }, [pong]);

  useEffect(() => {
    if (!pong) return;

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
  }, [pong]);

  return (
    <section
      ref={pageRef}
      className={styles.page}
      data-page="play"
      data-play-pong={pong ? "true" : undefined}
    >
      <PlayGame pong={pong} />
    </section>
  );
}
