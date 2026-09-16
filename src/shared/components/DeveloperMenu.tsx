"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import {
  formatChangedDeveloperLayoutOffsets,
  hasChangedDeveloperLayoutOffsets,
  hasChangedDeveloperSettings,
  DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED,
} from "@shared/developer/layout-copy";
import {
  FILM_GRAIN_INTENSITY_MAX,
  FILM_GRAIN_INTENSITY_MIN,
  formatAtmosphereIntensity,
  PAGE_GLOW_INTENSITY_MAX,
  PAGE_GLOW_INTENSITY_MIN,
} from "@shared/developer/atmosphere-layout";
import {
  ARSENAL_GLOW_RADIUS_MAX,
  ARSENAL_GLOW_RADIUS_MIN,
  ARSENAL_GRID_OFFSET_MAX,
  ARSENAL_GRID_OFFSET_MIN,
  ARSENAL_TILT_MAX_MAX,
  ARSENAL_TILT_MAX_MIN,
  ARSENAL_TILT_SPILL_MAX,
  ARSENAL_TILT_SPILL_MIN,
  formatArsenalGlowRadius,
  formatArsenalGridOffset,
  formatArsenalTiltMax,
  formatArsenalTiltSpill,
} from "@shared/developer/arsenal-layout";
import {
  CONTACT_OR_OFFSET_MAX,
  CONTACT_OR_OFFSET_MIN,
} from "@shared/developer/contact-layout";
import {
  formatBackgroundScale,
  HOME_BACKGROUND_SCALE_MAX,
  HOME_BACKGROUND_SCALE_MIN,
  HOME_LAYOUT_OPTIONS,
} from "@shared/developer/home-layout";
import {
  PLAY_GAME_OFFSET_MAX,
  PLAY_GAME_OFFSET_MIN,
  PLAY_GAME_SCALE_MAX,
  PLAY_GAME_SCALE_MIN,
  formatPlayGameOffset,
} from "@shared/developer/play-layout";
import { PositionJoystick } from "@shared/developer/PositionJoystick";
import { ScaleSlider } from "@shared/developer/ScaleSlider";
import { VerticalOffsetSlider } from "@shared/developer/VerticalOffsetSlider";
import { themeForPath } from "@shared/theme";
import styles from "./DeveloperMenu.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  originRef: RefObject<HTMLElement | null>;
};

const SCREEN_INSET = 8;
const BUTTON_INSET = 12;

function expandSheetClip(sheet: HTMLDivElement) {
  sheet.style.setProperty("--clip-top", "0px");
  sheet.style.setProperty("--clip-right", "0px");
  sheet.style.setProperty("--clip-bottom", "0px");
  sheet.style.setProperty("--clip-left", "0px");
}

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

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M4.5 10.5h-.75A1.25 1.25 0 0 1 2.5 9.25v-6A1.25 1.25 0 0 1 3.75 2h6A1.25 1.25 0 0 1 11 3.25v.75"
        stroke="currentColor"
        strokeWidth="1.3"
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
  const pathname = usePathname();
  const theme = themeForPath(pathname);
  const isHomeRoute = pathname === "/";
  const isContactRoute = pathname === "/hire-me";
  const isArsenalRoute = pathname === "/arsenal";
  const isPlayRoute = pathname === "/play";
  const {
    footerEnabled,
    setFooterEnabled,
    goldenSpiralEnabled,
    setGoldenSpiralEnabled,
    goldenSpiralMirrorX,
    setGoldenSpiralMirrorX,
    goldenSpiralMirrorY,
    setGoldenSpiralMirrorY,
    homeLayoutOffsets,
    setHomeLayoutOffset,
    homeBackgroundScale,
    setHomeBackgroundScale,
    rightsEnabled,
    setRightsEnabled,
    rightsPosition,
    setRightsPosition,
    contactOrOffset,
    setContactOrOffset,
    arsenalTiltMaxDeg,
    setArsenalTiltMaxDeg,
    arsenalTiltSpillPercent,
    setArsenalTiltSpillPercent,
    arsenalGlowRadiusPx,
    setArsenalGlowRadiusPx,
    arsenalGridOffsetY,
    setArsenalGridOffsetY,
    playGameScale,
    setPlayGameScale,
    playGameOffsetY,
    setPlayGameOffsetY,
    filmGrainEnabled,
    setFilmGrainEnabled,
    filmGrainIntensity,
    setFilmGrainIntensity,
    pageGlowEnabled,
    setPageGlowEnabled,
    pageGlowIntensity,
    setPageGlowIntensity,
    portraitGlyphSoundsEnabled,
    setPortraitGlyphSoundsEnabled,
    resetDeveloperSettings,
  } = useDeveloperSettings();
  const sheetRef = useRef<HTMLDivElement>(null);
  const customPositionRef = useRef<{ left: number; top: number } | null>(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    startPointerX: 0,
    startPointerY: 0,
    startLeft: 0,
    startTop: 0,
  });
  const [hold, setHold] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [layoutCopied, setLayoutCopied] = useState(false);
  const shown = open || hold;
  const hasChangedLayoutOffsets = hasChangedDeveloperLayoutOffsets(
    homeLayoutOffsets,
    homeBackgroundScale,
    rightsPosition,
    contactOrOffset,
    arsenalTiltMaxDeg,
    arsenalTiltSpillPercent,
    arsenalGlowRadiusPx,
    arsenalGridOffsetY,
    playGameScale,
    playGameOffsetY,
  );
  const hasChangedSettings = hasChangedDeveloperSettings(
    footerEnabled,
    goldenSpiralEnabled,
    goldenSpiralMirrorX,
    goldenSpiralMirrorY,
    homeLayoutOffsets,
    homeBackgroundScale,
    rightsEnabled,
    rightsPosition,
    contactOrOffset,
    arsenalTiltMaxDeg,
    arsenalTiltSpillPercent,
    arsenalGlowRadiusPx,
    arsenalGridOffsetY,
    playGameScale,
    playGameOffsetY,
    filmGrainEnabled,
    filmGrainIntensity,
    pageGlowEnabled,
    pageGlowIntensity,
    portraitGlyphSoundsEnabled,
  );
  const footerDisabled = !footerEnabled;
  const showRightsPosition = footerDisabled && rightsEnabled;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!layoutCopied) return;
    const timeout = window.setTimeout(() => setLayoutCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [layoutCopied]);

  useEffect(() => {
    if (open) return;
    setLayoutCopied(false);
  }, [open]);

  const clampSheetPosition = useCallback((left: number, top: number) => {
    const sheet = sheetRef.current;
    if (!sheet) return { left, top };

    const width = sheet.offsetWidth || sheet.getBoundingClientRect().width;
    const height = sheet.offsetHeight || sheet.getBoundingClientRect().height;
    const maxLeft = Math.max(SCREEN_INSET, window.innerWidth - width - SCREEN_INSET);
    const maxTop = Math.max(SCREEN_INSET, window.innerHeight - height - SCREEN_INSET);

    return {
      left: Math.min(maxLeft, Math.max(SCREEN_INSET, left)),
      top: Math.min(maxTop, Math.max(SCREEN_INSET, top)),
    };
  }, []);

  const applySheetPosition = useCallback(
    (left: number, top: number) => {
      const sheet = sheetRef.current;
      if (!sheet) return null;

      const clamped = clampSheetPosition(left, top);
      sheet.style.setProperty("--sheet-left", `${clamped.left}px`);
      sheet.style.setProperty("--sheet-top", `${clamped.top}px`);
      customPositionRef.current = clamped;
      return clamped;
    },
    [clampSheetPosition],
  );

  const updateOrigin = useCallback(() => {
    const origin = originRef.current;
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (customPositionRef.current) {
      applySheetPosition(customPositionRef.current.left, customPositionRef.current.top);
      expandSheetClip(sheet);
      return;
    }

    if (!origin) return;

    const originBox = origin.getBoundingClientRect();
    const parent = sheet.offsetParent;
    const parentBox = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const panelLeft = Math.max(SCREEN_INSET, originBox.left - BUTTON_INSET);
    const panelTop = Math.max(SCREEN_INSET, originBox.top - BUTTON_INSET);

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
  }, [applySheetPosition, originRef]);

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

  const onHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!open || event.button !== 0) return;

    const target = event.target;
    if (target instanceof Element && target.closest(`.${styles.closeButton}`)) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = sheet.getBoundingClientRect();
    const currentLeft = customPositionRef.current?.left ?? rect.left;
    const currentTop = customPositionRef.current?.top ?? rect.top;

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
    };
    setIsDragging(true);
    expandSheetClip(sheet);
  };

  const onHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    const dx = event.clientX - dragStateRef.current.startPointerX;
    const dy = event.clientY - dragStateRef.current.startPointerY;
    applySheetPosition(dragStateRef.current.startLeft + dx, dragStateRef.current.startTop + dy);
  };

  const onHeaderPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    dragStateRef.current.active = false;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const copyChangedLayoutOffsets = async () => {
    const payload = formatChangedDeveloperLayoutOffsets(
      homeLayoutOffsets,
      homeBackgroundScale,
      rightsPosition,
      contactOrOffset,
      arsenalTiltMaxDeg,
      arsenalTiltSpillPercent,
      arsenalGlowRadiusPx,
      arsenalGridOffsetY,
      playGameScale,
      playGameOffsetY,
    );
    if (!payload) return;

    try {
      await navigator.clipboard.writeText(payload);
      setLayoutCopied(true);
    } catch {
      // Clipboard access can fail outside secure contexts.
    }
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
          <div
            className={styles.panel}
            style={
              {
                "--color-accent": theme.accent,
                "--color-accent-deep": theme.accentDeep,
                "--shadow-nav": theme.shadowNav,
              } as CSSProperties
            }
          >
            <div
              className={`${styles.panelDragHandle} ${isDragging ? styles.panelDragHandleDragging : ""}`}
              onPointerDown={onHeaderPointerDown}
              onPointerMove={onHeaderPointerMove}
              onPointerUp={onHeaderPointerUp}
              onPointerCancel={onHeaderPointerUp}
            >
              <div className={styles.panelHeader}>
                <p className={styles.title}>developer</p>
                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label="Close developer menu"
                  onClick={onClose}
                  onPointerDown={(event) => event.stopPropagation()}
                  tabIndex={open ? 0 : -1}
                >
                  <MenuCloseIcon />
                </button>
              </div>
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
                  <div
                    className={`${styles.mirrorButtons} ${
                      goldenSpiralEnabled ? "" : styles.mirrorButtonsHidden
                    }`}
                    aria-hidden={!goldenSpiralEnabled}
                  >
                    <button
                      type="button"
                      className={`${styles.mirrorButton} ${goldenSpiralMirrorX ? styles.mirrorButtonActive : ""}`}
                      aria-label="Mirror golden spiral left/right"
                      aria-pressed={goldenSpiralMirrorX}
                      onClick={() => setGoldenSpiralMirrorX(!goldenSpiralMirrorX)}
                      tabIndex={goldenSpiralEnabled && open ? 0 : -1}
                      disabled={!goldenSpiralEnabled}
                    >
                      <MirrorHorizontalIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.mirrorButton} ${goldenSpiralMirrorY ? styles.mirrorButtonActive : ""}`}
                      aria-label="Mirror golden spiral up/down"
                      aria-pressed={goldenSpiralMirrorY}
                      onClick={() => setGoldenSpiralMirrorY(!goldenSpiralMirrorY)}
                      tabIndex={goldenSpiralEnabled && open ? 0 : -1}
                      disabled={!goldenSpiralEnabled}
                    >
                      <MirrorVerticalIcon />
                    </button>
                  </div>
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
              <div className={styles.toggleGroup}>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>film grain</span>
                  <label className={styles.toggleControl}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={filmGrainEnabled}
                      onChange={(event) => setFilmGrainEnabled(event.target.checked)}
                      tabIndex={open ? 0 : -1}
                    />
                    <span
                      className={`${styles.switch} ${filmGrainEnabled ? styles.switchOn : ""}`}
                      aria-hidden="true"
                    />
                  </label>
                </div>
                {filmGrainEnabled ? (
                  <div className={styles.toggleSliderRow}>
                    <span className={styles.positionLabel}>grain intensity</span>
                    <ScaleSlider
                      value={filmGrainIntensity}
                      onChange={setFilmGrainIntensity}
                      min={FILM_GRAIN_INTENSITY_MIN}
                      max={FILM_GRAIN_INTENSITY_MAX}
                      formatReadout={formatAtmosphereIntensity}
                      ariaLabel="Adjust film grain intensity"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                ) : null}
              </div>
              <div className={styles.toggleGroup}>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>page glow</span>
                  <label className={styles.toggleControl}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={pageGlowEnabled}
                      onChange={(event) => setPageGlowEnabled(event.target.checked)}
                      tabIndex={open ? 0 : -1}
                    />
                    <span
                      className={`${styles.switch} ${pageGlowEnabled ? styles.switchOn : ""}`}
                      aria-hidden="true"
                    />
                  </label>
                </div>
                {pageGlowEnabled ? (
                  <div className={styles.toggleSliderRow}>
                    <span className={styles.positionLabel}>glow intensity</span>
                    <ScaleSlider
                      value={pageGlowIntensity}
                      onChange={setPageGlowIntensity}
                      min={PAGE_GLOW_INTENSITY_MIN}
                      max={PAGE_GLOW_INTENSITY_MAX}
                      formatReadout={formatAtmosphereIntensity}
                      ariaLabel="Adjust page glow intensity"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                ) : null}
              </div>
            </div>
            {isHomeRoute ? (
              <div className={styles.routeSection}>
                <p className={styles.sectionTitle}>home</p>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>portrait hover sounds</span>
                  <label className={styles.toggleControl}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={portraitGlyphSoundsEnabled}
                      onChange={(event) => setPortraitGlyphSoundsEnabled(event.target.checked)}
                      tabIndex={open ? 0 : -1}
                    />
                    <span
                      className={`${styles.switch} ${portraitGlyphSoundsEnabled ? styles.switchOn : ""}`}
                      aria-hidden="true"
                    />
                  </label>
                </div>
                <div className={styles.positionRows}>
                  {HOME_LAYOUT_OPTIONS.map((option) => (
                    <div key={option.key} className={styles.positionRow}>
                      <span className={styles.positionLabel}>{option.label}</span>
                      <PositionJoystick
                        value={homeLayoutOffsets[option.key]}
                        onChange={(offset) => setHomeLayoutOffset(option.key, offset)}
                        tabIndex={open ? 0 : -1}
                      />
                    </div>
                  ))}
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>background scale</span>
                    <ScaleSlider
                      value={homeBackgroundScale}
                      onChange={setHomeBackgroundScale}
                      min={HOME_BACKGROUND_SCALE_MIN}
                      max={HOME_BACKGROUND_SCALE_MAX}
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {isContactRoute ? (
              <div className={styles.routeSection}>
                <p className={styles.sectionTitle}>contact</p>
                <div className={styles.positionRows}>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>or distance</span>
                    <VerticalOffsetSlider
                      value={contactOrOffset}
                      onChange={setContactOrOffset}
                      min={CONTACT_OR_OFFSET_MIN}
                      max={CONTACT_OR_OFFSET_MAX}
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {isArsenalRoute ? (
              <div className={styles.routeSection}>
                <p className={styles.sectionTitle}>arsenal</p>
                <div className={styles.positionRows}>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>grid position</span>
                    <VerticalOffsetSlider
                      value={arsenalGridOffsetY}
                      onChange={setArsenalGridOffsetY}
                      min={ARSENAL_GRID_OFFSET_MIN}
                      max={ARSENAL_GRID_OFFSET_MAX}
                      formatReadout={formatArsenalGridOffset}
                      ariaLabel="Adjust bento grid vertical position"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>max tilt</span>
                    <ScaleSlider
                      value={arsenalTiltMaxDeg}
                      onChange={setArsenalTiltMaxDeg}
                      min={ARSENAL_TILT_MAX_MIN}
                      max={ARSENAL_TILT_MAX_MAX}
                      formatReadout={formatArsenalTiltMax}
                      ariaLabel="Adjust max tile tilt"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>tilt spill</span>
                    <ScaleSlider
                      value={arsenalTiltSpillPercent}
                      onChange={setArsenalTiltSpillPercent}
                      min={ARSENAL_TILT_SPILL_MIN}
                      max={ARSENAL_TILT_SPILL_MAX}
                      formatReadout={formatArsenalTiltSpill}
                      ariaLabel="Adjust neighboring tile tilt spill"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>glow radius</span>
                    <ScaleSlider
                      value={arsenalGlowRadiusPx}
                      onChange={setArsenalGlowRadiusPx}
                      min={ARSENAL_GLOW_RADIUS_MIN}
                      max={ARSENAL_GLOW_RADIUS_MAX}
                      formatReadout={formatArsenalGlowRadius}
                      ariaLabel="Adjust hover glow radius"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {isPlayRoute ? (
              <div className={styles.routeSection}>
                <p className={styles.sectionTitle}>play</p>
                <div className={styles.positionRows}>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>game scale</span>
                    <ScaleSlider
                      value={playGameScale}
                      onChange={setPlayGameScale}
                      min={PLAY_GAME_SCALE_MIN}
                      max={PLAY_GAME_SCALE_MAX}
                      formatReadout={formatBackgroundScale}
                      ariaLabel="Adjust game scale"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>game position</span>
                    <VerticalOffsetSlider
                      value={playGameOffsetY}
                      onChange={setPlayGameOffsetY}
                      min={PLAY_GAME_OFFSET_MIN}
                      max={PLAY_GAME_OFFSET_MAX}
                      formatReadout={formatPlayGameOffset}
                      ariaLabel="Adjust game vertical position"
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <div className={styles.routeSection}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>rights</p>
                <label className={`${styles.toggleControl} ${footerEnabled ? styles.toggleControlDisabled : ""}`}>
                  <input
                    className={styles.toggleInput}
                    type="checkbox"
                    checked={showRightsPosition}
                    disabled={footerEnabled}
                    onChange={(event) => setRightsEnabled(event.target.checked)}
                    tabIndex={open ? 0 : -1}
                  />
                  <span
                    className={`${styles.switch} ${showRightsPosition ? styles.switchOn : ""}`}
                    aria-hidden="true"
                  />
                </label>
              </div>
              {showRightsPosition ? (
                <div className={styles.positionRows}>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>position</span>
                    <PositionJoystick
                      value={rightsPosition}
                      onChange={setRightsPosition}
                      tabIndex={open ? 0 : -1}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {hasChangedSettings ? (
              <div className={styles.copyFooter}>
                <button
                  type="button"
                  className={styles.resetButton}
                  aria-label="Reset developer settings to defaults"
                  onClick={resetDeveloperSettings}
                  tabIndex={open ? 0 : -1}
                >
                  reset values
                </button>
                {hasChangedLayoutOffsets ? (
                  <button
                    type="button"
                    className={`${styles.copyButton} ${layoutCopied ? styles.copyButtonCopied : ""}`}
                    aria-label={layoutCopied ? "Copied layout offsets" : "Copy changed layout offsets"}
                    onClick={() => void copyChangedLayoutOffsets()}
                    tabIndex={open ? 0 : -1}
                  >
                    {layoutCopied ? "copied" : <CopyIcon />}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!mounted) return null;

  return createPortal(menu, document.body);
}
