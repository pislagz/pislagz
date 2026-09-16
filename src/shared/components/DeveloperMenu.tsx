"use client";

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
import { createPortal } from "react-dom";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import styles from "./DeveloperMenu.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  originRef: RefObject<HTMLElement | null>;
};

function MenuCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MirrorHorizontalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4.5 5.5 8 2.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13.5 4.5 10.5 8 13.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 2.5v11" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.6" />
    </svg>
  );
}

function MirrorVerticalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 2.5 8 5.5 11.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4.5 13.5 8 10.5 11.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.6" />
    </svg>
  );
}

export function DeveloperMenu({ open, onClose, originRef }: Props) {
  const {
    footerEnabled,
    setFooterEnabled,
    goldenSpiralEnabled,
    setGoldenSpiralEnabled,
    goldenSpiralMirrorX,
    setGoldenSpiralMirrorX,
    goldenSpiralMirrorY,
    setGoldenSpiralMirrorY,
  } = useDeveloperSettings();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [hold, setHold] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shown = open || hold;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateOrigin = useCallback(() => {
    const origin = originRef.current;
    const sheet = sheetRef.current;
    if (!origin || !sheet) return;

    const originBox = origin.getBoundingClientRect();
    const parent = sheet.offsetParent;
    const parentBox = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenInset = 8;
    const buttonInset = 12;
    const panelLeft = Math.max(screenInset, originBox.left - buttonInset);
    const panelTop = Math.max(screenInset, originBox.top - buttonInset);

    sheet.style.setProperty("--sheet-left", `${panelLeft}px`);
    sheet.style.setProperty("--sheet-top", `${panelTop}px`);

    const x = originBox.left + originBox.width / 2 - (parentBox.left + sheet.offsetLeft);
    const y = originBox.top + originBox.height / 2 - (parentBox.top + sheet.offsetTop);
    const halfW = originBox.width / 2;
    const halfH = originBox.height / 2;

    sheet.style.setProperty("--clip-top", `${Math.max(0, y - halfH)}px`);
    sheet.style.setProperty("--clip-right", `${Math.max(0, sheet.offsetWidth - x - halfW)}px`);
    sheet.style.setProperty("--clip-bottom", `${Math.max(0, sheet.offsetHeight - y - halfH)}px`);
    sheet.style.setProperty("--clip-left", `${Math.max(0, x - halfW)}px`);
  }, [originRef]);

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
    if (!shown) {
      delete document.documentElement.dataset.developerMenuOpen;
      return;
    }

    document.documentElement.dataset.developerMenuOpen = "true";
    return () => {
      delete document.documentElement.dataset.developerMenuOpen;
    };
  }, [shown]);

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

  const menu = (
    <div
      className={`${styles.drawer} ${shown ? styles.present : ""} ${expanded ? styles.expanded : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Developer menu"
      aria-hidden={!open}
      id="developer-menu"
    >
      <button className={styles.backdrop} aria-label="Close developer menu" onClick={onClose} tabIndex={open ? 0 : -1} />
      {shown ? (
        <div
          ref={sheetRef}
          className={styles.sheet}
          onTransitionEnd={onSheetTransitionEnd}
          style={
            {
              "--clip-top": "0px",
              "--clip-right": "100%",
              "--clip-bottom": "100%",
              "--clip-left": "0px",
              "--sheet-top": "8px",
              "--sheet-left": "8px",
            } as CSSProperties
          }
        >
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <p className={styles.title}>developer</p>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close developer menu"
                onClick={onClose}
                tabIndex={open ? 0 : -1}
              >
                <MenuCloseIcon />
              </button>
            </div>
            <div className={styles.toggles}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>disable footer</span>
                <label className={styles.toggleControl}>
                  <input
                    className={styles.toggleInput}
                    type="checkbox"
                    checked={!footerEnabled}
                    onChange={(event) => setFooterEnabled(!event.target.checked)}
                    tabIndex={open ? 0 : -1}
                  />
                  <span className={`${styles.switch} ${!footerEnabled ? styles.switchOn : ""}`} aria-hidden="true" />
                </label>
              </div>
              <div className={styles.toggleRow}>
                <span className={`${styles.toggleLabel} ${styles.toggleLabelSpiral}`}>
                  golden spiral
                </span>
                <div className={`${styles.toggleControl} ${styles.toggleControlSpiral}`}>
                  {goldenSpiralEnabled ? (
                    <div className={styles.mirrorButtons}>
                      <button
                        type="button"
                        className={`${styles.mirrorButton} ${goldenSpiralMirrorX ? styles.mirrorButtonActive : ""}`}
                        aria-label="Mirror golden spiral left/right"
                        aria-pressed={goldenSpiralMirrorX}
                        onClick={() => setGoldenSpiralMirrorX(!goldenSpiralMirrorX)}
                        tabIndex={open ? 0 : -1}
                      >
                        <MirrorHorizontalIcon />
                      </button>
                      <button
                        type="button"
                        className={`${styles.mirrorButton} ${goldenSpiralMirrorY ? styles.mirrorButtonActive : ""}`}
                        aria-label="Mirror golden spiral up/down"
                        aria-pressed={goldenSpiralMirrorY}
                        onClick={() => setGoldenSpiralMirrorY(!goldenSpiralMirrorY)}
                        tabIndex={open ? 0 : -1}
                      >
                        <MirrorVerticalIcon />
                      </button>
                    </div>
                  ) : null}
                  <label className={styles.switchLabel}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={goldenSpiralEnabled}
                      onChange={(event) => setGoldenSpiralEnabled(event.target.checked)}
                      tabIndex={open ? 0 : -1}
                    />
                    <span
                      className={`${styles.switch} ${goldenSpiralEnabled ? styles.switchOn : ""}`}
                      aria-hidden="true"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!mounted) return null;

  return createPortal(menu, document.body);
}
