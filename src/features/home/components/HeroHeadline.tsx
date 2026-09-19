"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
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

const HEADLINE_MIN_FONT_PX = 36;
const HEADLINE_MIN_FONT_MOBILE_PX = 21;
const MOBILE_QUERY = "(max-width: 900px)";
const TABLET_QUERY = "(max-width: 1100px)";

const PHRASES = [
  "next.js",
  "detail-oriented",
  "product-conscious",
  "AI-enhanced",
  "type-safe",
  "coffee-powered",
  "bug-hunting",
  "friendly neighborhood",
  "optimizing",
  "making-it-better",
  "feature-shipping",
  "component-obsessed",
  "prototyping",
  "accessibility-first",
  "SEO-friendly",
  "div-wrangling",
  "polishing",
  "react-loving",
  "performance-minded",
  "pixel perfect",
] as const;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function getHeadlineWidthLimit(heading: HTMLElement) {
  const hero = heading.parentElement?.parentElement;
  if (hero) {
    const styles = getComputedStyle(hero);
    const padL = Number.parseFloat(styles.paddingLeft) || 0;
    const padR = Number.parseFloat(styles.paddingRight) || 0;
    const heroLimit = hero.clientWidth - padL - padR;
    if (heroLimit > 0) return heroLimit;
  }

  const padX = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--pad-x"),
  );
  const horizontalPad = Number.isFinite(padX) ? padX * 2 : 42;
  return Math.max(0, document.documentElement.clientWidth - horizontalPad);
}

function measureHeadlineContent(heading: HTMLElement) {
  const styles = getComputedStyle(heading);
  const gap = Number.parseFloat(styles.gap) || 0;
  const children = Array.from(heading.children) as HTMLElement[];
  if (children.length === 0) return heading.scrollWidth;
  const useGap = styles.display.includes("flex") || styles.display.includes("grid");
  const textWidth = children.reduce((sum, child) => {
    const childStyles = getComputedStyle(child);
    const margin =
      (Number.parseFloat(childStyles.marginLeft) || 0) +
      (Number.parseFloat(childStyles.marginRight) || 0);
    return sum + child.scrollWidth + margin;
  }, 0);
  return textWidth + (useGap ? gap * Math.max(0, children.length - 1) : 0);
}

export function HeroHeadline() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery(MOBILE_QUERY);
  const tablet = useMediaQuery(TABLET_QUERY);
  const { bigHeaderEnabled } = useDeveloperSettings();
  const [text, setText] = useState(START);
  const [caret, setCaret] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fitHeadline = useCallback(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const minSize = mobile ? HEADLINE_MIN_FONT_MOBILE_PX : HEADLINE_MIN_FONT_PX;
    const widthLimit = getHeadlineWidthLimit(heading);
    if (widthLimit < 1) return;

    heading.style.fontSize = "";
    const max = Number.parseFloat(getComputedStyle(heading).fontSize);
    let size = max;
    heading.style.fontSize = `${size}px`;

    while (measureHeadlineContent(heading) > widthLimit && size > minSize) {
      size -= 1;
      heading.style.fontSize = `${size}px`;
    }
  }, [bigHeaderEnabled, mobile, tablet]);

  useLayoutEffect(() => {
    fitHeadline();
  }, [fitHeadline, text, caret]);

  useEffect(() => {
    const onResize = () => fitHeadline();
    window.addEventListener("resize", onResize);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      viewport?.removeEventListener("resize", onResize);
    };
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
    <h1
      ref={headingRef}
      className={`${styles.headline} ${bigHeaderEnabled ? styles.bigHeader : ""}`}
    >
      <span className={styles.your}>Your</span>
      <span className={styles.typed}>
        <span className={styles.next}>{text}</span>
        <span
          className={`${styles.caret} ${caret ? "" : styles.caretHidden}`}
          aria-hidden="true"
        />
      </span>
    </h1>
  );
}
