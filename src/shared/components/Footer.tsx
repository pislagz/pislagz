"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { SOCIAL } from "@shared/constants";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

let arsenalHasSettled = false;
let delayPlayFooterAction = false;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const onHirePage = pathname === "/hire-me";
  const onArsenalPage = pathname === "/arsenal";
  const onPlayPage = pathname === "/play";
  const onResumePage = pathname === "/resume";
  const mobile = useMediaQuery("(max-width: 900px)");
  const playActionDelayPending =
    pathname === "/play" && delayPlayFooterAction;
  const [arsenalReady, setArsenalReady] = useState(arsenalHasSettled);
  const [showPrimaryAction, setShowPrimaryAction] = useState(true);
  const [dragging, setDragging] = useState(false);
  const dockRef = useRef(0);
  const dockTargetRef = useRef(0);
  const sheetDrag = useRef<{
    y: number;
    start: number;
    moved: boolean;
    height: number;
  } | null>(null);
  const footerRef = useRef<HTMLElement>(null);

  const writeDock = (value: number) => {
    dockRef.current = value;
    footerRef.current?.style.setProperty("--dock", String(value));
    window.dispatchEvent(
      new CustomEvent("pong-footer-progress", { detail: { dock: value } }),
    );
  };

  const HANDLE_SLOT = 22;

  const measureTravel = () => {
    const el = footerRef.current;
    if (!el) return 0;
    const fullHeight = el.offsetHeight + (1 - dockRef.current) * HANDLE_SLOT;
    return Math.max(fullHeight - 34, 0);
  };

  const syncTravel = () => {
    const el = footerRef.current;
    if (!el) return;
    if (sheetDrag.current) return;
    if (dockTargetRef.current !== dockRef.current) return;
    el.style.setProperty("--dock-travel", `${measureTravel()}px`);
  };
  const showArsenalContinue =
    onArsenalPage && (mobile || arsenalReady || arsenalHasSettled);
  const showPlayResume =
    onPlayPage && showPrimaryAction && !playActionDelayPending;
  const showResumeAction = showPlayResume || onHirePage;

  useLayoutEffect(() => {
    if (!onArsenalPage) {
      setArsenalReady(false);
      return;
    }
    if (window.matchMedia("(max-width: 900px)").matches) {
      setArsenalReady(true);
      return;
    }
    const revealContinue = () => {
      arsenalHasSettled = true;
      setArsenalReady(true);
    };
    const alreadySettled =
      arsenalHasSettled ||
      document.documentElement.dataset.arsenalSettled === "true";
    if (alreadySettled) arsenalHasSettled = true;
    setArsenalReady(alreadySettled);
    window.addEventListener("arsenal-grid-settled", revealContinue);
    return () => window.removeEventListener("arsenal-grid-settled", revealContinue);
  }, [onArsenalPage]);

  useEffect(() => {
    if (pathname !== "/play" || !delayPlayFooterAction) {
      setShowPrimaryAction(true);
      return;
    }
    delayPlayFooterAction = false;
    setShowPrimaryAction(false);
    const timeout = window.setTimeout(() => setShowPrimaryAction(true), 2800);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!onPlayPage || !mobile) return;
    syncTravel();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncTravel);
    window.addEventListener("resize", syncTravel);
    return () => {
      viewport?.removeEventListener("resize", syncTravel);
      window.removeEventListener("resize", syncTravel);
    };
  }, [mobile, onPlayPage, showPrimaryAction, showResumeAction]);

  useEffect(() => {
    if (!onPlayPage || !mobile) {
      dockTargetRef.current = 0;
      writeDock(0);
      return;
    }
    const applyDock = (nextDocked: boolean) => {
      const next = nextDocked ? 1 : 0;
      if (dockTargetRef.current === next) return;
      dockTargetRef.current = next;
      if (next === 1 && dockRef.current === 0 && !sheetDrag.current) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (dockTargetRef.current !== 1 || sheetDrag.current) return;
            footerRef.current?.style.setProperty(
              "--dock-travel",
              `${measureTravel()}px`,
            );
            writeDock(1);
          });
        });
        return;
      }
      writeDock(next);
    };
    applyDock(document.documentElement.dataset.pongFooterDocked === "true");
    const onDock = (event: Event) => {
      const { docked: nextDocked } = (
        event as CustomEvent<{ docked: boolean }>
      ).detail;
      applyDock(nextDocked);
    };
    window.addEventListener("pong-footer-dock", onDock);
    return () => {
      window.removeEventListener("pong-footer-dock", onDock);
      dockTargetRef.current = 0;
      writeDock(0);
    };
  }, [mobile, onPlayPage]);

  const snapDock = (value: number) => {
    const next = value > 0.45 ? 1 : 0;
    dockTargetRef.current = next;
    writeDock(next);
    setDragging(false);
  };

  const onSheetPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!playSheet) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("a, button") &&
      !target.closest(`.${styles.handle}`)
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const travel = measureTravel();
    footerRef.current?.style.setProperty("--dock-travel", `${travel}px`);
    sheetDrag.current = {
      y: event.clientY,
      start: dockRef.current,
      moved: false,
      height: Math.max(travel, 80),
    };
    setDragging(true);
  };
  const onSheetPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = sheetDrag.current;
    if (!drag) return;
    const delta = event.clientY - drag.y;
    if (Math.abs(delta) > 6) drag.moved = true;
    const next = Math.min(1, Math.max(0, drag.start + delta / drag.height));
    writeDock(next);
  };
  const onSheetPointerUp = () => {
    const drag = sheetDrag.current;
    sheetDrag.current = null;
    if (!drag) return;
    if (!drag.moved) {
      if (drag.start > 0.5) snapDock(0);
      else setDragging(false);
      return;
    }
    snapDock(dockRef.current);
  };

  const playSheet = onPlayPage && mobile;

  return (
    <footer
      ref={footerRef}
      className={`${styles.footer} ${playSheet ? styles.playSheet : ""} ${
        dragging ? styles.dragging : ""
      }`}
      onPointerDown={playSheet ? onSheetPointerDown : undefined}
      onPointerMove={playSheet ? onSheetPointerMove : undefined}
      onPointerUp={playSheet ? onSheetPointerUp : undefined}
      onPointerCancel={playSheet ? onSheetPointerUp : undefined}
    >
      <div className={styles.panel}>
        {playSheet ? (
          <div className={styles.handleSlot} aria-hidden="true">
            <div className={styles.handle}>
              <svg className={styles.handleIcon} viewBox="0 0 48 14" width="48" height="14">
                <path
                  className={styles.handlePath}
                  d={dragging ? "M4 7 24 7 44 7" : "M5 9.2 24 6.5 43 9.2"}
                />
              </svg>
            </div>
          </div>
        ) : null}
        <div className={styles.inner}>
          <Logo variant="footer" />
          <p className={styles.copy}>
            All rights reserved | Pawel Pisulski | {currentYear}
          </p>
          {showPrimaryAction && !playActionDelayPending ? (
            <div
              className={`${styles.actions} ${
                !showArsenalContinue && !showResumeAction && !onResumePage
                  ? styles.singleAction
                  : ""
              } ${
                onPlayPage || onArsenalPage || onHirePage
                  ? styles.actionsMobileFlip
                  : ""
              } ${
                onPlayPage || onArsenalPage ? styles.actionsArsenalFlip : ""
              }`}
            >
              {onResumePage ? (
                <a
                  href={SOCIAL.linkedin}
                  className={styles.message}
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              ) : null}
              <Link
                href={onHirePage ? "/" : "/hire-me"}
                className={
                  onResumePage
                    ? `${styles.continue} ${styles.contactContinue}`
                    : styles.message
                }
              >
                {onHirePage ? "Homepage" : "Send message"}
                <img
                  src={onHirePage ? "/assets/icons/home.svg" : "/assets/icons/send.svg"}
                  alt=""
                  width={12}
                  height={12}
                />
              </Link>
              {showArsenalContinue ? (
                <Link
                  href="/play"
                  className={`${styles.continue} ${styles.continuePulse}`}
                  onClick={() => {
                    delayPlayFooterAction = true;
                  }}
                >
                  Continue
                </Link>
              ) : null}
              {showResumeAction ? (
                <Link
                  href="/resume"
                  className={`${styles.continue} ${
                    onHirePage ? styles.hireContinue : styles.resumeContinue
                  }`}
                >
                  See résumé
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
