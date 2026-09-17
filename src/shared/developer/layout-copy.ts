import {
  formatChangedPlaySettings,
  hasChangedPlaySettings,
} from "./play-layout";
import {
  isFilmGrainSettingsChanged,
  isPageGlowSettingsChanged,
} from "./atmosphere-layout";
import {
  formatChangedArsenalSettings,
  hasChangedArsenalSettings,
} from "./arsenal-layout";
import {
  formatChangedHeaderGradientSettings,
  hasChangedHeaderGradientSettings,
} from "./header-gradient-layout";
import {
  DEFAULT_BIG_HEADER_ENABLED,
  formatChangedHomeLayoutOffsets,
  formatPositionAxis,
  hasChangedHomeLayoutOffsets,
  isHomeLayoutOffsetChanged,
  type HomeLayoutOffsets,
  type PositionOffset,
} from "./home-layout";

export function hasChangedDeveloperLayoutOffsets(
  homeOffsets: HomeLayoutOffsets,
  backgroundScale: number,
  rightsPosition: PositionOffset,
  arsenalTiltMaxDeg: number,
  arsenalTiltSpillPercent: number,
  arsenalGlowRadiusPx: number,
  arsenalGridOffsetY: number,
  playGameScale: number,
  playGameOffsetY: number,
): boolean {
  return (
    hasChangedHomeLayoutOffsets(homeOffsets, backgroundScale) ||
    isHomeLayoutOffsetChanged(rightsPosition) ||
    hasChangedArsenalSettings(
      arsenalTiltMaxDeg,
      arsenalTiltSpillPercent,
      arsenalGlowRadiusPx,
      arsenalGridOffsetY,
    ) ||
    hasChangedPlaySettings(playGameScale, playGameOffsetY)
  );
}

export function formatChangedDeveloperLayoutOffsets(
  homeOffsets: HomeLayoutOffsets,
  backgroundScale: number,
  rightsPosition: PositionOffset,
  arsenalTiltMaxDeg: number,
  arsenalTiltSpillPercent: number,
  arsenalGlowRadiusPx: number,
  arsenalGridOffsetY: number,
  playGameScale: number,
  playGameOffsetY: number,
  bigHeaderEnabled: boolean,
  dynamicHeaderGlowEnabled: boolean,
  headerGradientColorA: string,
  headerGradientColorB: string,
  headerGradientDirection: PositionOffset,
): string {
  const lines: string[] = [];
  const homeLines = formatChangedHomeLayoutOffsets(homeOffsets, backgroundScale);

  if (homeLines) {
    lines.push(homeLines);
  }

  if (bigHeaderEnabled !== DEFAULT_BIG_HEADER_ENABLED) {
    lines.push(`enable big header: ${bigHeaderEnabled ? "on" : "off"}`);
  }

  const headerGradientLines = formatChangedHeaderGradientSettings(
    dynamicHeaderGlowEnabled,
    headerGradientColorA,
    headerGradientColorB,
    headerGradientDirection,
  );
  if (headerGradientLines) {
    lines.push(headerGradientLines);
  }

  if (isHomeLayoutOffsetChanged(rightsPosition)) {
    lines.push(
      `rights position: x: ${formatPositionAxis(rightsPosition.x)} y: ${formatPositionAxis(rightsPosition.y)}`,
    );
  }

  const arsenalLines = formatChangedArsenalSettings(
    arsenalTiltMaxDeg,
    arsenalTiltSpillPercent,
    arsenalGlowRadiusPx,
    arsenalGridOffsetY,
  );
  if (arsenalLines) {
    lines.push(arsenalLines);
  }

  const playLines = formatChangedPlaySettings(playGameScale, playGameOffsetY);
  if (playLines) {
    lines.push(playLines);
  }

  return lines.join("\n");
}

export const DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED = false;

export function hasChangedDeveloperSettings(
  footerEnabled: boolean,
  goldenSpiralEnabled: boolean,
  goldenSpiralMirrorX: boolean,
  goldenSpiralMirrorY: boolean,
  homeOffsets: HomeLayoutOffsets,
  backgroundScale: number,
  rightsEnabled: boolean,
  rightsPosition: PositionOffset,
  arsenalTiltMaxDeg: number,
  arsenalTiltSpillPercent: number,
  arsenalGlowRadiusPx: number,
  arsenalGridOffsetY: number,
  playGameScale: number,
  playGameOffsetY: number,
  filmGrainEnabled: boolean,
  filmGrainIntensity: number,
  pageGlowEnabled: boolean,
  pageGlowIntensity: number,
  portraitGlyphSoundsEnabled: boolean,
  bigHeaderEnabled: boolean,
  dynamicHeaderGlowEnabled: boolean,
  headerGradientColorA: string,
  headerGradientColorB: string,
  headerGradientDirection: PositionOffset,
): boolean {
  return (
    footerEnabled ||
    goldenSpiralEnabled ||
    goldenSpiralMirrorX ||
    goldenSpiralMirrorY ||
    !rightsEnabled ||
    isFilmGrainSettingsChanged(filmGrainEnabled, filmGrainIntensity) ||
    isPageGlowSettingsChanged(pageGlowEnabled, pageGlowIntensity) ||
    portraitGlyphSoundsEnabled !== DEFAULT_PORTRAIT_GLYPH_SOUNDS_ENABLED ||
    bigHeaderEnabled !== DEFAULT_BIG_HEADER_ENABLED ||
    hasChangedHeaderGradientSettings(
      dynamicHeaderGlowEnabled,
      headerGradientColorA,
      headerGradientColorB,
      headerGradientDirection,
    ) ||
    hasChangedDeveloperLayoutOffsets(
      homeOffsets,
      backgroundScale,
      rightsPosition,
      arsenalTiltMaxDeg,
      arsenalTiltSpillPercent,
      arsenalGlowRadiusPx,
      arsenalGridOffsetY,
      playGameScale,
      playGameOffsetY,
    )
  );
}
