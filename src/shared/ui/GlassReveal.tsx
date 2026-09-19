"use client";

import { type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import styles from "./GlassReveal.module.css";

type Props = {
  show: boolean;
  delayMs?: number;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function GlassReveal({ show, delayMs = 0, children, className, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(show);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) {
      setOpen(false);
      const timeout = window.setTimeout(() => setShown(false), 520);
      return () => window.clearTimeout(timeout);
    }

    setShown(true);
    let cancelled = false;
    const root = ref.current;

    const start = () => {
      if (!cancelled) setOpen(true);
    };

    const glassReady = () =>
      Boolean(root?.querySelector("[data-glass-surface][data-ready='true']"));

    if (glassReady()) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(start));
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    const observer = new MutationObserver(() => {
      if (!glassReady()) return;
      observer.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(start));
    });
    if (root) {
      observer.observe(root, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-ready"],
      });
    }
    const fallback = window.setTimeout(start, 400);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [show]);

  return (
    <div
      ref={ref}
      className={[
        styles.stack,
        className ?? "",
        shown ? styles.shown : "",
        open ? styles.open : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!show}
      {...rest}
    >
      {children}
      <span
        className={`${styles.cover} ${open ? styles.coverOut : ""}`}
        aria-hidden="true"
        style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      />
    </div>
  );
}
