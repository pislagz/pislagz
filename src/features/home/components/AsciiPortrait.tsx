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

function mountCanvases(stack: HTMLDivElement) {
  stack.replaceChildren();
  const glowCanvas = document.createElement("canvas");
  const glyphCanvas = document.createElement("canvas");
  glowCanvas.className = styles.glowCanvas ?? "glowCanvas";
  glyphCanvas.className = styles.glyphCanvas ?? "glyphCanvas";
  stack.append(glowCanvas, glyphCanvas);
  return { glowCanvas, glyphCanvas };
}

export function AsciiPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
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
          field = createAsciiPortrait(glowCanvas, glyphCanvas, image, portraitOptions);
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

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div ref={stackRef} className={styles.stack} />
    </div>
  );
}
