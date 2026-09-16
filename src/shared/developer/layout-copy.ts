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
import { formatContactOrOffset, isContactOrOffsetChanged } from "./contact-layout";
import {
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
  contactOrOffset: number,
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
    isContactOrOffsetChanged(contactOrOffset) ||
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
  contactOrOffset: number,
  arsenalTiltMaxDeg: number,
  arsenalTiltSpillPercent: number,
  arsenalGlowRadiusPx: number,
  arsenalGridOffsetY: number,
  playGameScale: number,
  playGameOffsetY: number,
): string {
  const lines: string[] = [];
  const homeLines = formatChangedHomeLayoutOffsets(homeOffsets, backgroundScale);

  if (homeLines) {
    lines.push(homeLines);
  }

  if (isHomeLayoutOffsetChanged(rightsPosition)) {
    lines.push(
      `rights position: x: ${formatPositionAxis(rightsPosition.x)} y: ${formatPositionAxis(rightsPosition.y)}`,
    );
  }

  if (isContactOrOffsetChanged(contactOrOffset)) {
    lines.push(`or distance: ${formatContactOrOffset(contactOrOffset)}`);
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
  contactOrOffset: number,
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
    hasChangedDeveloperLayoutOffsets(
      homeOffsets,
      backgroundScale,
      rightsPosition,
      contactOrOffset,
      arsenalTiltMaxDeg,
      arsenalTiltSpillPercent,
      arsenalGlowRadiusPx,
      arsenalGridOffsetY,
      playGameScale,
      playGameOffsetY,
    )
  );
}
