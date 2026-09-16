"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import {
  createAsciiPortrait,
  loadPortraitImage,
  tryCreateAsciiPortraitWorker,
  type AsciiPortraitHandle,
} from "../lib/ascii-portrait";
import styles from "./AsciiPortrait.module.css";

const MAX_TILT_DEG = 1.5;
const SPRING = 0.055;
const DAMPING = 0.9;
const HIT_PADDING = 0.14;

function mountCanvases(stack: HTMLDivElement) {
  stack.replaceChildren();
  const glowCanvas = document.createElement("canvas");
  const glyphCanvas = document.createElement("canvas");
  glowCanvas.className = styles.glowCanvas ?? "glowCanvas";
  glyphCanvas.className = styles.glyphCanvas ?? "glyphCanvas";
  stack.append(glowCanvas, glyphCanvas);
  return { glowCanvas, glyphCanvas };
}

type PortraitMetrics = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  originX: number;
  originY: number;
  hitLeft: number;
  hitTop: number;
  hitRight: number;
  hitBottom: number;
};

function getPortraitMetrics(
  root: HTMLDivElement,
  stack: HTMLDivElement,
  tilt: HTMLDivElement,
): PortraitMetrics | null {
  const canvas = stack.querySelector<HTMLCanvasElement>("canvas:last-of-type");
  if (!canvas) return null;

  const canvasRect = canvas.getBoundingClientRect();
  const tiltRect = tilt.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();

  if (canvasRect.width < 8 || canvasRect.height < 8 || tiltRect.width < 8) {
    return null;
  }

  const centerX = canvasRect.left + canvasRect.width / 2;
  const centerY = canvasRect.top + canvasRect.height / 2;
  const padX = rootRect.width * HIT_PADDING;
  const padY = rootRect.height * HIT_PADDING;

  return {
    centerX,
    centerY,
    radiusX: canvasRect.width * 0.62,
    radiusY: canvasRect.height * 0.62,
    originX: ((centerX - tiltRect.left) / tiltRect.width) * 100,
    originY: ((centerY - tiltRect.top) / tiltRect.height) * 100,
    hitLeft: rootRect.left - padX,
    hitTop: rootRect.top - padY,
    hitRight: rootRect.right + padX,
    hitBottom: rootRect.bottom + padY,
  };
}

export function AsciiPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<AsciiPortraitHandle | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    void loadPortraitImage();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stack = stackRef.current;
    if (!root || !stack) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let started = false;

    const getSize = () => ({
      width: root.clientWidth,
      height: root.clientHeight,
    });

    const reveal = () => {
      stack.classList.add(styles.ready);
    };

    const start = () => {
      if (started || cancelled) return;
      const { width, height } = getSize();
      if (width < 8 || height < 8) return;
      started = true;
      observer?.disconnect();
      observer = null;

      void loadPortraitImage().then(async (image) => {
        if (cancelled || !image || !root.isConnected || !stack.isConnected) return;

        const portraitOptions = {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onReady: () => {
            if (!cancelled) reveal();
          },
        };

        let { glowCanvas, glyphCanvas } = mountCanvases(stack);

        let field = await tryCreateAsciiPortraitWorker(glowCanvas, glyphCanvas, image, {
          ...portraitOptions,
          getSize,
        });

        if (!field) {
          ({ glowCanvas, glyphCanvas } = mountCanvases(stack));
          field = createAsciiPortrait(glowCanvas, glyphCanvas, image, {
            ...portraitOptions,
            getSize,
          });
        }

        if (cancelled) {
          field.destroy();
          stack.replaceChildren();
          return;
        }

        fieldRef.current = field;
      });
    };

    start();
    if (!started) {
      observer = new ResizeObserver(() => start());
      observer.observe(root);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      fieldRef.current?.destroy();
      fieldRef.current = null;
      stack.classList.remove(styles.ready);
      stack.replaceChildren();
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const root = rootRef.current;
    const stack = stackRef.current;
    const tilt = tiltRef.current;
    if (!root || !stack || !tilt) return;

    let frameId = 0;
    let metrics: PortraitMetrics | null = null;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let velocityRotateX = 0;
    let velocityRotateY = 0;

    const syncMetrics = () => {
      metrics = getPortraitMetrics(root, stack, tilt);
      if (!metrics) return;
      tilt.style.transformOrigin = `${metrics.originX.toFixed(2)}% ${metrics.originY.toFixed(2)}%`;
    };

    const tick = () => {
      velocityRotateX =
        (velocityRotateX + (targetRotateX - currentRotateX) * SPRING) * DAMPING;
      velocityRotateY =
        (velocityRotateY + (targetRotateY - currentRotateY) * SPRING) * DAMPING;
      currentRotateX += velocityRotateX;
      currentRotateY += velocityRotateY;

      const settled =
        Math.abs(currentRotateX) < 0.015 &&
        Math.abs(currentRotateY) < 0.015 &&
        Math.abs(velocityRotateX) < 0.004 &&
        Math.abs(velocityRotateY) < 0.004 &&
        targetRotateX === 0 &&
        targetRotateY === 0;

      if (settled) {
        currentRotateX = 0;
        currentRotateY = 0;
        velocityRotateX = 0;
        velocityRotateY = 0;
        tilt.style.transform = "";
        tilt.style.willChange = "";
        frameId = 0;
        return;
      }

      tilt.style.willChange = "transform";
      tilt.style.transform = `rotateX(${currentRotateX.toFixed(3)}deg) rotateY(${currentRotateY.toFixed(3)}deg)`;
      frameId = window.requestAnimationFrame(tick);
    };

    const scheduleTick = () => {
      if (!frameId) frameId = window.requestAnimationFrame(tick);
    };

    const updatePortraitPointer = (clientX: number, clientY: number) => {
      const canvas = stack.querySelector<HTMLCanvasElement>("canvas:last-of-type");
      const field = fieldRef.current;
      if (!canvas || !field) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      const insideCanvas =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!insideCanvas) return;

      field.setPointer(clientX - rect.left, clientY - rect.top, true);
    };

    const updateFromPoint = (clientX: number, clientY: number) => {
      if (!metrics) syncMetrics();
      if (!metrics) return;

      const inside =
        clientX >= metrics.hitLeft &&
        clientX <= metrics.hitRight &&
        clientY >= metrics.hitTop &&
        clientY <= metrics.hitBottom;

      if (inside) updatePortraitPointer(clientX, clientY);

      if (!inside) {
        targetRotateX = 0;
        targetRotateY = 0;
        scheduleTick();
        return;
      }

      const dx = (clientX - metrics.centerX) / metrics.radiusX;
      const dy = (clientY - metrics.centerY) / metrics.radiusY;
      const nx = Math.max(-1, Math.min(1, dx));
      const ny = Math.max(-1, Math.min(1, dy));

      targetRotateY = nx * MAX_TILT_DEG;
      targetRotateX = -ny * MAX_TILT_DEG;
      scheduleTick();
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateFromPoint(event.clientX, event.clientY);
    };

    const resetTilt = () => {
      targetRotateX = 0;
      targetRotateY = 0;
      scheduleTick();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") resetTilt();
    };

    syncMetrics();
    const resizeObserver = new ResizeObserver(() => syncMetrics());
    resizeObserver.observe(root);
    resizeObserver.observe(stack);
    resizeObserver.observe(tilt);

    const mutationObserver = new MutationObserver(() => syncMetrics());
    mutationObserver.observe(stack, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
    });

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("resize", syncMetrics, { passive: true });
    window.addEventListener("blur", resetTilt);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("resize", syncMetrics);
      window.removeEventListener("blur", resetTilt);
      if (frameId) window.cancelAnimationFrame(frameId);
      tilt.style.transform = "";
      tilt.style.transformOrigin = "";
      tilt.style.willChange = "";
    };
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div ref={tiltRef} className={styles.tilt}>
        <div ref={stackRef} className={styles.stack} />
      </div>
    </div>
  );
}
