"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_ARSENAL_GLOW_RADIUS_PX,
  DEFAULT_ARSENAL_GRID_OFFSET_Y,
  DEFAULT_ARSENAL_TILT_MAX_DEG,
  DEFAULT_ARSENAL_TILT_SPILL_PERCENT,
  applyArsenalLayoutVars,
  clearArsenalLayoutVars,
} from "./arsenal-layout";
import {
  applyHomeLayoutVars,
  clearHomeLayoutVars,
  DEFAULT_HOME_LAYOUT_OFFSETS,
  DEFAULT_HOME_BACKGROUND_SCALE,
  DEFAULT_BIG_HEADER_ENABLED,
  type HomeLayoutKey,
  type HomeLayoutOffsets,
  type PositionOffset,
} from "./home-layout";
import {
  applyRightsLayoutVars,
  clearRightsLayoutVars,
  DEFAULT_RIGHTS_POSITION,
} from "./rights-layout";
import {
  applyPlayLayoutVars,
  clearPlayLayoutVars,
  DEFAULT_PLAY_GAME_OFFSET_Y,
  DEFAULT_PLAY_GAME_SCALE,
} from "./play-layout";
import {
  applyAtmosphereVars,
  clearAtmosphereVars,
  DEFAULT_FILM_GRAIN_ENABLED,
  DEFAULT_FILM_GRAIN_INTENSITY,
  DEFAULT_PAGE_GLOW_ENABLED,
  DEFAULT_PAGE_GLOW_INTENSITY,
} from "./atmosphere-layout";
import {
  applyHeaderGradientVars,
  clearHeaderGradientVars,
  DEFAULT_DYNAMIC_HEADER_GLOW_ENABLED,
  DEFAULT_HEADER_GRADIENT_COLOR_A,
  DEFAULT_HEADER_GRADIENT_COLOR_B,
  DEFAULT_HEADER_GRADIENT_DIRECTION,
  normalizeHeaderGradientColor,
} from "./header-gradient-layout";
import {
  DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED,
} from "./layout-copy";

type DeveloperSettings = {
  footerEnabled: boolean;
  setFooterEnabled: (value: boolean) => void;
  goldenSpiralEnabled: boolean;
  setGoldenSpiralEnabled: (value: boolean) => void;
  goldenSpiralMirrorX: boolean;
  setGoldenSpiralMirrorX: (value: boolean) => void;
  goldenSpiralMirrorY: boolean;
  setGoldenSpiralMirrorY: (value: boolean) => void;
  homeLayoutOffsets: HomeLayoutOffsets;
  setHomeLayoutOffset: (key: HomeLayoutKey, offset: PositionOffset) => void;
  homeBackgroundScale: number;
  setHomeBackgroundScale: (value: number) => void;
  bigHeaderEnabled: boolean;
  setBigHeaderEnabled: (value: boolean) => void;
  rightsEnabled: boolean;
  setRightsEnabled: (value: boolean) => void;
  rightsPosition: PositionOffset;
  setRightsPosition: (offset: PositionOffset) => void;
  arsenalTiltMaxDeg: number;
  setArsenalTiltMaxDeg: (value: number) => void;
  arsenalTiltSpillPercent: number;
  setArsenalTiltSpillPercent: (value: number) => void;
  arsenalGlowRadiusPx: number;
  setArsenalGlowRadiusPx: (value: number) => void;
  arsenalGridOffsetY: number;
  setArsenalGridOffsetY: (value: number) => void;
  playGameScale: number;
  setPlayGameScale: (value: number) => void;
  playGameOffsetY: number;
  setPlayGameOffsetY: (value: number) => void;
  filmGrainEnabled: boolean;
  setFilmGrainEnabled: (value: boolean) => void;
  filmGrainIntensity: number;
  setFilmGrainIntensity: (value: number) => void;
  pageGlowEnabled: boolean;
  setPageGlowEnabled: (value: boolean) => void;
  pageGlowIntensity: number;
  setPageGlowIntensity: (value: number) => void;
  portraitGlyphSoundsEnabled: boolean;
  setPortraitGlyphSoundsEnabled: (value: boolean) => void;
  dynamicHeaderGlowEnabled: boolean;
  setDynamicHeaderGlowEnabled: (value: boolean) => void;
  headerGradientColorA: string;
  setHeaderGradientColorA: (value: string) => void;
  headerGradientColorB: string;
  setHeaderGradientColorB: (value: string) => void;
  headerGradientDirection: PositionOffset;
  setHeaderGradientDirection: (offset: PositionOffset) => void;
  resetDeveloperSettings: () => void;
};

const DeveloperSettingsContext = createContext<DeveloperSettings | null>(null);

export function DeveloperSettingsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [goldenSpiralEnabled, setGoldenSpiralEnabled] = useState(false);
  const [goldenSpiralMirrorX, setGoldenSpiralMirrorX] = useState(false);
  const [goldenSpiralMirrorY, setGoldenSpiralMirrorY] = useState(false);
  const [homeLayoutOffsets, setHomeLayoutOffsets] = useState<HomeLayoutOffsets>(
    DEFAULT_HOME_LAYOUT_OFFSETS,
  );
  const [homeBackgroundScale, setHomeBackgroundScale] = useState(DEFAULT_HOME_BACKGROUND_SCALE);
  const [bigHeaderEnabled, setBigHeaderEnabled] = useState(DEFAULT_BIG_HEADER_ENABLED);
  const [rightsEnabled, setRightsEnabled] = useState(true);
  const [rightsPosition, setRightsPosition] = useState(DEFAULT_RIGHTS_POSITION);
  const [arsenalTiltMaxDeg, setArsenalTiltMaxDeg] = useState(DEFAULT_ARSENAL_TILT_MAX_DEG);
  const [arsenalTiltSpillPercent, setArsenalTiltSpillPercent] = useState(
    DEFAULT_ARSENAL_TILT_SPILL_PERCENT,
  );
  const [arsenalGlowRadiusPx, setArsenalGlowRadiusPx] = useState(DEFAULT_ARSENAL_GLOW_RADIUS_PX);
  const [arsenalGridOffsetY, setArsenalGridOffsetY] = useState(DEFAULT_ARSENAL_GRID_OFFSET_Y);
  const [playGameScale, setPlayGameScale] = useState(DEFAULT_PLAY_GAME_SCALE);
  const [playGameOffsetY, setPlayGameOffsetY] = useState(DEFAULT_PLAY_GAME_OFFSET_Y);
  const [filmGrainEnabled, setFilmGrainEnabled] = useState(DEFAULT_FILM_GRAIN_ENABLED);
  const [filmGrainIntensity, setFilmGrainIntensity] = useState(DEFAULT_FILM_GRAIN_INTENSITY);
  const [pageGlowEnabled, setPageGlowEnabled] = useState(DEFAULT_PAGE_GLOW_ENABLED);
  const [pageGlowIntensity, setPageGlowIntensity] = useState(DEFAULT_PAGE_GLOW_INTENSITY);
  const [portraitGlyphSoundsEnabled, setPortraitGlyphSoundsEnabled] = useState(
    DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED,
  );
  const [dynamicHeaderGlowEnabled, setDynamicHeaderGlowEnabled] = useState(
    DEFAULT_DYNAMIC_HEADER_GLOW_ENABLED,
  );
  const [headerGradientColorA, setHeaderGradientColorA] = useState(DEFAULT_HEADER_GRADIENT_COLOR_A);
  const [headerGradientColorB, setHeaderGradientColorB] = useState(DEFAULT_HEADER_GRADIENT_COLOR_B);
  const [headerGradientDirection, setHeaderGradientDirection] = useState(
    DEFAULT_HEADER_GRADIENT_DIRECTION,
  );

  const resetDeveloperSettings = useCallback(() => {
    setFooterEnabled(false);
    setGoldenSpiralEnabled(false);
    setGoldenSpiralMirrorX(false);
    setGoldenSpiralMirrorY(false);
    setHomeLayoutOffsets(DEFAULT_HOME_LAYOUT_OFFSETS);
    setHomeBackgroundScale(DEFAULT_HOME_BACKGROUND_SCALE);
    setBigHeaderEnabled(DEFAULT_BIG_HEADER_ENABLED);
    setRightsEnabled(true);
    setRightsPosition(DEFAULT_RIGHTS_POSITION);
    setArsenalTiltMaxDeg(DEFAULT_ARSENAL_TILT_MAX_DEG);
    setArsenalTiltSpillPercent(DEFAULT_ARSENAL_TILT_SPILL_PERCENT);
    setArsenalGlowRadiusPx(DEFAULT_ARSENAL_GLOW_RADIUS_PX);
    setArsenalGridOffsetY(DEFAULT_ARSENAL_GRID_OFFSET_Y);
    setPlayGameScale(DEFAULT_PLAY_GAME_SCALE);
    setPlayGameOffsetY(DEFAULT_PLAY_GAME_OFFSET_Y);
    setFilmGrainEnabled(DEFAULT_FILM_GRAIN_ENABLED);
    setFilmGrainIntensity(DEFAULT_FILM_GRAIN_INTENSITY);
    setPageGlowEnabled(DEFAULT_PAGE_GLOW_ENABLED);
    setPageGlowIntensity(DEFAULT_PAGE_GLOW_INTENSITY);
    setPortraitGlyphSoundsEnabled(DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED);
    setDynamicHeaderGlowEnabled(DEFAULT_DYNAMIC_HEADER_GLOW_ENABLED);
    setHeaderGradientColorA(DEFAULT_HEADER_GRADIENT_COLOR_A);
    setHeaderGradientColorB(DEFAULT_HEADER_GRADIENT_COLOR_B);
    setHeaderGradientDirection(DEFAULT_HEADER_GRADIENT_DIRECTION);
  }, []);

  const setHomeLayoutOffset = useCallback((key: HomeLayoutKey, offset: PositionOffset) => {
    setHomeLayoutOffsets((current) => ({
      ...current,
      [key]: offset,
    }));
  }, []);

  useEffect(() => {
    if (!footerEnabled) return;
    setRightsEnabled(false);
  }, [footerEnabled]);

  useEffect(() => {
    if (footerEnabled) {
      document.documentElement.dataset.footerEnabled = "true";
      return;
    }

    delete document.documentElement.dataset.footerEnabled;
    return () => {
      delete document.documentElement.dataset.footerEnabled;
    };
  }, [footerEnabled]);

  useEffect(() => {
    if (!footerEnabled && rightsEnabled) {
      applyRightsLayoutVars(rightsPosition);
      return;
    }

    clearRightsLayoutVars();
    return () => {
      clearRightsLayoutVars();
    };
  }, [footerEnabled, rightsEnabled, rightsPosition]);

  useEffect(() => {
    if (pathname === "/") {
      applyHomeLayoutVars(homeLayoutOffsets);
      applyHeaderGradientVars(
        dynamicHeaderGlowEnabled,
        headerGradientColorA,
        headerGradientColorB,
        headerGradientDirection,
      );
      return;
    }

    clearHomeLayoutVars();
    clearHeaderGradientVars();
    return () => {
      clearHomeLayoutVars();
      clearHeaderGradientVars();
    };
  }, [
    pathname,
    homeLayoutOffsets,
    dynamicHeaderGlowEnabled,
    headerGradientColorA,
    headerGradientColorB,
    headerGradientDirection,
  ]);

  useEffect(() => {
    if (pathname.startsWith("/arsenal")) {
      applyArsenalLayoutVars(arsenalGlowRadiusPx, arsenalGridOffsetY);
      return;
    }

    clearArsenalLayoutVars();
    return () => {
      clearArsenalLayoutVars();
    };
  }, [pathname, arsenalGlowRadiusPx, arsenalGridOffsetY]);

  useEffect(() => {
    if (pathname.startsWith("/play")) {
      applyPlayLayoutVars(playGameScale, playGameOffsetY);
      return;
    }

    clearPlayLayoutVars();
    return () => {
      clearPlayLayoutVars();
    };
  }, [pathname, playGameScale, playGameOffsetY]);

  useEffect(() => {
    applyAtmosphereVars(
      filmGrainEnabled,
      filmGrainIntensity,
      pageGlowEnabled,
      pageGlowIntensity,
    );
    return () => {
      clearAtmosphereVars();
    };
  }, [filmGrainEnabled, filmGrainIntensity, pageGlowEnabled, pageGlowIntensity]);

  return (
    <DeveloperSettingsContext.Provider
      value={{
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
        bigHeaderEnabled,
        setBigHeaderEnabled,
        rightsEnabled,
        setRightsEnabled,
        rightsPosition,
        setRightsPosition,
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
        dynamicHeaderGlowEnabled,
        setDynamicHeaderGlowEnabled,
        headerGradientColorA,
        setHeaderGradientColorA: (value: string) =>
          setHeaderGradientColorA(normalizeHeaderGradientColor(value)),
        headerGradientColorB,
        setHeaderGradientColorB: (value: string) =>
          setHeaderGradientColorB(normalizeHeaderGradientColor(value)),
        headerGradientDirection,
        setHeaderGradientDirection,
        resetDeveloperSettings,
      }}
    >
      {children}
    </DeveloperSettingsContext.Provider>
  );
}

export function useDeveloperSettings() {
  const context = useContext(DeveloperSettingsContext);
  if (!context) {
    throw new Error("useDeveloperSettings must be used within DeveloperSettingsProvider");
  }
  return context;
}
