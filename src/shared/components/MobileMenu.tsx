"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type TransitionEvent,
} from "react";
import { NAV_ITEMS, SOCIAL } from "@shared/constants";
import styles from "./MobileMenu.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  originRef: RefObject<HTMLButtonElement | null>;
};

export function MobileMenu({ open, onClose, originRef }: Props) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [hold, setHold] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shown = open || hold;

  const updateOrigin = useCallback(() => {
    const origin = originRef.current;
    const sheet = sheetRef.current;
    if (!origin || !sheet) return;

    const originBox = origin.getBoundingClientRect();
    const parent = sheet.offsetParent;
    const parentBox = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenInset = 8;
    const iconSize = 22;
    const iconTop = originBox.top + (originBox.height - iconSize) / 2;
    const iconRight = originBox.right - (originBox.width - iconSize) / 2;
    const panelRight = window.innerWidth - screenInset;
    const edgeGap = Math.max(0, panelRight - iconRight);

    sheet.style.setProperty("--sheet-right", `${screenInset}px`);
    sheet.style.setProperty("--sheet-top", `${Math.max(screenInset, iconTop - edgeGap)}px`);

    const x = originBox.left + originBox.width / 2 - (parentBox.left + sheet.offsetLeft);
    const y = originBox.top + originBox.height / 2 - (parentBox.top + sheet.offsetTop);
    const halfW = originBox.width / 2;
    const halfH = originBox.height / 2;

    sheet.style.setProperty("--clip-top", `${Math.max(0, y - halfH)}px`);
    sheet.style.setProperty("--clip-right", `${Math.max(0, sheet.offsetWidth - x - halfW)}px`);
    sheet.style.setProperty("--clip-bottom", `${Math.max(0, sheet.offsetHeight - y - halfH)}px`);
    sheet.style.setProperty("--clip-left", `${Math.max(0, x - halfW)}px`);
  }, [originRef]);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useLayoutEffect(() => {
    if (!open) {
      setExpanded(false);
      return;
    }

    setHold(true);
    updateOrigin();
    const frame = requestAnimationFrame(() => {
      updateOrigin();
      setExpanded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, updateOrigin]);

  useEffect(() => {
    if (!shown) return;

    updateOrigin();
    window.addEventListener("resize", updateOrigin);
    return () => window.removeEventListener("resize", updateOrigin);
  }, [shown, updateOrigin]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open || !hold) return;
    const timeout = window.setTimeout(() => setHold(false), 700);
    return () => window.clearTimeout(timeout);
  }, [open, hold]);

  const onSheetTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "clip-path" && event.propertyName !== "opacity") return;
    if (!open) setHold(false);
  };

  return (
    <div
      className={`${styles.drawer} ${shown ? styles.present : ""} ${expanded ? styles.expanded : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      aria-hidden={!open}
      id="mobile-navigation"
    >
      <button className={styles.backdrop} aria-label="Close menu" onClick={onClose} tabIndex={open ? 0 : -1} />
      {shown ? (
        <div
          ref={sheetRef}
          className={styles.sheet}
          onTransitionEnd={onSheetTransitionEnd}
          style={
            {
              "--clip-top": "0px",
              "--clip-right": "0px",
              "--clip-bottom": "100%",
              "--clip-left": "100%",
              "--sheet-top": "8px",
              "--sheet-right": "8px",
            } as CSSProperties
          }
        >
          <div className={styles.panel}>
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.link} ${active ? styles.active : ""}`}
                    tabIndex={open ? 0 : -1}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className={styles.hire}>
              <Link href="/hire-me" className={styles.hireButton} tabIndex={open ? 0 : -1}>
                hire me
                <img src="/assets/icons/work.svg" alt="" width={14} height={14} />
              </Link>
            </div>
            <div className={styles.social}>
              <a
                href={SOCIAL.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                tabIndex={open ? 0 : -1}
              >
                <img src="/assets/icons/github.svg" alt="" width={18} height={18} />
              </a>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                tabIndex={open ? 0 : -1}
              >
                <img src="/assets/icons/linkedin.svg" alt="" width={17} height={17} />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
