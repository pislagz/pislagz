"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "../pages/HomePage.module.css";

const START = "next";

const TYPEWRITER = {
  /** Pause after the homepage loads, before the caret appears. */
  initialDelayMs: 3000,
  /** Pause after the caret appears, before typing `.js`. */
  caretAppearMs: 420,
  /** Delay between characters while typing. */
  typeMs: 88,
  /** Delay between characters while deleting. */
  eraseMs: 42,
  /** How long to show `next.js` before erasing. */
  holdNextJsMs: 1800,
  /** How long to show each later phrase before erasing. */
  holdPhraseMs: 2200,
  /** Pause after a phrase is fully erased, before typing the next one. */
  afterEraseMs: 260,
  /** Pause after typing `next` again, before typing `.js`. */
  afterNextBeforeJsMs: 280,
} as const;

const HEADLINE_MIN_FONT_PX = 18;

const PHRASES = [
  "next.js",
  "detail-oriented",
  "product-conscious",
  "AI-enhanced",
  "type-safe",
  "friendly neighborhood",
  "soon-to-be favorite",
  "SEO-friendly",
  "accessibility-first",
  "component-obsessed",
  "div-wrangling",
  "React-loving",
  "performance-minded",
  "pixel perfect",
  "animation guru",
];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function HeroHeadline() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [text, setText] = useState(START);
  const [caret, setCaret] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fitHeadline = useCallback(() => {
    const heading = headingRef.current;
    if (!heading) return;
    heading.style.fontSize = "";
    const max = Number.parseFloat(getComputedStyle(heading).fontSize);
    let size = max;
    heading.style.fontSize = `${size}px`;
    while (heading.scrollWidth > heading.clientWidth && size > HEADLINE_MIN_FONT_PX) {
      size -= 1;
      heading.style.fontSize = `${size}px`;
    }
  }, []);

  useLayoutEffect(() => {
    fitHeadline();
  }, [text, caret, fitHeadline]);

  useEffect(() => {
    window.addEventListener("resize", fitHeadline);
    return () => window.removeEventListener("resize", fitHeadline);
  }, [fitHeadline]);

  useEffect(() => {
    if (reducedMotion) {
      setText(START);
      setCaret(false);
      return;
    }

    let cancelled = false;
    let current = START;
    setText(START);
    setCaret(false);

    const typeTo = async (target: string) => {
      for (let index = current.length; index < target.length; index += 1) {
        if (cancelled) return;
        current = target.slice(0, index + 1);
        setText(current);
        await wait(TYPEWRITER.typeMs);
      }
    };

    const erase = async () => {
      while (current.length > 0) {
        if (cancelled) return;
        current = current.slice(0, -1);
        setText(current);
        await wait(TYPEWRITER.eraseMs);
      }
    };

    const run = async () => {
      await wait(TYPEWRITER.initialDelayMs);
      if (cancelled) return;
      setCaret(true);
      await wait(TYPEWRITER.caretAppearMs);
      await typeTo("next.js");
      await wait(TYPEWRITER.holdNextJsMs);

      let phrase = 1;
      while (!cancelled) {
        await erase();
        await wait(TYPEWRITER.afterEraseMs);
        const next = PHRASES[phrase];
        if (next === "next.js") {
          await typeTo("next");
          await wait(TYPEWRITER.afterNextBeforeJsMs);
          if (cancelled) return;
          await typeTo("next.js");
        } else {
          await typeTo(next);
        }
        await wait(TYPEWRITER.holdPhraseMs);
        phrase = (phrase + 1) % PHRASES.length;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  return (
    <h1 ref={headingRef} className={styles.headline}>
      <span className={styles.your}>Your</span>
      <span className={styles.typed}>
        <span className={styles.next}>{text}</span>
        {caret ? <span className={styles.caret} aria-hidden="true" /> : null}
      </span>
    </h1>
  );
}
