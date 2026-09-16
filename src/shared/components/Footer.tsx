"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { SOCIAL } from "@shared/constants";
import { FooterCopyright } from "./FooterCopyright";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

let arsenalHasSettled = false;
let delayPlayFooterAction = false;

export function Footer() {
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
    pointerId: number;
    startX: number;
    startY: number;
    lastY: number;
    lastTime: number;
    start: number;
    active: boolean;
    height: number;
    velocityY: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const footerRef = useRef<HTMLElement>(null);

  const SNAP_THRESHOLD = 0.28;
  const FLING_VELOCITY = 0.28;
  const GESTURE_LOCK_PX = 8;

  const writeDock = (value: number) => {
    dockRef.current = value;
    footerRef.current?.style.setProperty("--dock", String(value));
    window.dispatchEvent(
      new CustomEvent("pong-footer-progress", { detail: { dock: value } }),
    );
  };

  const HANDLE_SLOT = 24;

  const measureTravel = () => {
    const el = footerRef.current;
    if (!el) return 0;
    const fullHeight = el.offsetHeight + (1 - dockRef.current) * HANDLE_SLOT;
    return Math.max(fullHeight - 38, 0);
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
    const next = value > SNAP_THRESHOLD ? 1 : 0;
    dockTargetRef.current = next;
    writeDock(next);
    setDragging(false);
  };

  const isSheetInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest("a, button, input, textarea, select, [role='button']"),
    );
  };

  const onSheetPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!playSheet || isSheetInteractiveTarget(event.target)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const travel = measureTravel();
    footerRef.current?.style.setProperty("--dock-travel", `${travel}px`);
    const now = performance.now();
    sheetDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: now,
      start: dockRef.current,
      active: false,
      height: Math.max(travel, 56),
      velocityY: 0,
    };
    setDragging(true);
  };
  const onSheetPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = sheetDrag.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!drag.active) {
      if (absX < GESTURE_LOCK_PX && absY < GESTURE_LOCK_PX) return;
      const verticalIntent =
        absY > absX * 0.7 || (drag.start > 0.5 && absY > 4);
      if (!verticalIntent) {
        sheetDrag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      drag.active = true;
    }

    const now = performance.now();
    const dt = Math.max(now - drag.lastTime, 1);
    drag.velocityY = (event.clientY - drag.lastY) / dt;
    drag.lastY = event.clientY;
    drag.lastTime = now;

    const next = Math.min(1, Math.max(0, drag.start + deltaY / drag.height));
    writeDock(next);
  };
  const onSheetPointerUp = (event: PointerEvent<HTMLElement>) => {
    const drag = sheetDrag.current;
    sheetDrag.current = null;
    if (!drag || event.pointerId !== drag.pointerId) {
      setDragging(false);
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const totalMove = Math.hypot(deltaX, deltaY);

    if (!drag.active) {
      if (totalMove < GESTURE_LOCK_PX && drag.start > 0.5) snapDock(0);
      else setDragging(false);
      return;
    }

    suppressClickRef.current = true;
    let snapValue = dockRef.current;
    if (drag.velocityY > FLING_VELOCITY) snapValue = 1;
    else if (drag.velocityY < -FLING_VELOCITY) snapValue = 0;
    snapDock(snapValue);
  };
  const onSheetClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const playSheet = onPlayPage && mobile;

  return (
    <footer
      ref={footerRef}
      data-footer-boundary=""
      className={`${styles.footer} ${playSheet ? styles.playSheet : ""} ${
        dragging ? styles.dragging : ""
      }`}
      onPointerDown={playSheet ? onSheetPointerDown : undefined}
      onPointerMove={playSheet ? onSheetPointerMove : undefined}
      onPointerUp={playSheet ? onSheetPointerUp : undefined}
      onPointerCancel={playSheet ? onSheetPointerUp : undefined}
      onClickCapture={playSheet ? onSheetClickCapture : undefined}
    >
      <div className={styles.panel}>
        {playSheet ? (
          <div className={styles.handleSlot} aria-hidden="true">
            <div className={styles.handle}>
              <svg className={styles.handleIcon} viewBox="0 0 48 14" width="48" height="14">
                <path
                  className={styles.handleChevron}
                  d="M5 9.2 24 6.5 43 9.2"
                />
                <path
                  className={styles.handleLine}
                  d="M4 7 24 7 44 7"
                />
              </svg>
            </div>
          </div>
        ) : null}
        <div className={styles.inner}>
          <Logo variant="footer" />
          <FooterCopyright />
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
                {onHirePage ? "Homepage" : "Contact me"}
                <img
                  src={onHirePage ? "/assets/icons/home.svg" : "/assets/icons/mail.svg"}
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
