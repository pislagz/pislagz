"use client";

import Link from "next/link";
import { useRef, useState, type RefObject } from "react";
import { LogoMark, LogoName } from "./Logo";
import logoStyles from "./Logo.module.css";
import styles from "./LogoDevTrigger.module.css";

const DRAG_THRESHOLD = 24;
const MAX_PULL = 34;

type Props = {
  devMenuOpen: boolean;
  onOpenMenu: () => void;
  originRef: RefObject<HTMLDivElement | null>;
};

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13.5a7.4 7.4 0 0 0 .1-3l1.7-1a.8.8 0 0 0 .2-1.1l-1.6-2.8a.8.8 0 0 0-1-.3l-2 .8a7.5 7.5 0 0 0-2.6-1.5l-.3-2.1a.8.8 0 0 0-.8-.7h-3.2a.8.8 0 0 0-.8.7l-.3 2.1a7.5 7.5 0 0 0-2.6 1.5l-2-.8a.8.8 0 0 0-1 .3L2.6 8.4a.8.8 0 0 0 .2 1.1l1.7 1a7.4 7.4 0 0 0 0 3l-1.7 1a.8.8 0 0 0-.2 1.1l1.6 2.8a.8.8 0 0 0 1 .3l2-.8c.8.6 1.7 1.1 2.6 1.5l.3 2.1a.8.8 0 0 0 .8.7h3.2a.8.8 0 0 0 .8-.7l.3-2.1c1-.4 1.8-.9 2.6-1.5l2 .8a.8.8 0 0 0 1-.3l1.6-2.8a.8.8 0 0 0-.2-1.1l-1.7-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoDevTrigger({ devMenuOpen, onOpenMenu, originRef }: Props) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const dragged = useRef(false);
  const activePointer = useRef<number | null>(null);

  const resetPull = () => {
    setDragging(false);
    setPull(0);
    activePointer.current = null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startY.current = event.clientY;
    dragged.current = false;
    activePointer.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || activePointer.current !== event.pointerId) return;

    const delta = Math.max(0, Math.min(MAX_PULL, event.clientY - startY.current));
    if (delta > 4) dragged.current = true;
    setPull(delta);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || activePointer.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pull >= DRAG_THRESHOLD) {
      onOpenMenu();
    }

    resetPull();
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointer.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetPull();
  };

  const onLogoClick = (event: React.MouseEvent) => {
    if (dragged.current) {
      event.preventDefault();
      event.stopPropagation();
      dragged.current = false;
    }
  };

  const cogVisible = pull > 6 || devMenuOpen;

  return (
    <Link
      href="/"
      className={`${logoStyles.logo} ${logoStyles.header}`}
      onClickCapture={onLogoClick}
    >
      <div ref={originRef} className={styles.markTrack}>
        <div className={styles.underlay}>
          <div
            className={`${styles.cogTile} ${cogVisible ? styles.cogTileVisible : ""} ${
              pull > 0 ? styles.cogTilePulled : ""
            }`}
          >
            <span className={styles.cog}>
              <CogIcon />
            </span>
          </div>
        </div>
        <div
          className={`${styles.slide} ${dragging ? styles.slideDragging : styles.slideIdle}`}
          style={{ transform: `translateY(${pull}px)` }}
        >
          <LogoMark variant="header" />
        </div>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label="Open developer menu"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      </div>
      <LogoName variant="header" />
    </Link>
  );
}
