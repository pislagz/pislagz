export const DEFAULT_FILM_GRAIN_ENABLED = false;
export const DEFAULT_FILM_GRAIN_INTENSITY = 28;
export const FILM_GRAIN_INTENSITY_MIN = 0;
export const FILM_GRAIN_INTENSITY_MAX = 100;

export const DEFAULT_PAGE_GLOW_ENABLED = false;
export const DEFAULT_PAGE_GLOW_INTENSITY = 20;
export const PAGE_GLOW_INTENSITY_MIN = 0;
export const PAGE_GLOW_INTENSITY_MAX = 100;

const MAX_FILM_GRAIN_OPACITY = 0.11;
const MAX_PAGE_GLOW_OPACITY = 0.16;

export function formatAtmosphereIntensity(value: number): string {
  return `${Math.round(value)}%`;
}

export function filmGrainOpacity(intensity: number): number {
  return (intensity / 100) * MAX_FILM_GRAIN_OPACITY;
}

export function pageGlowOpacity(intensity: number): number {
  return (intensity / 100) * MAX_PAGE_GLOW_OPACITY;
}

export function applyAtmosphereVars(
  filmGrainEnabled: boolean,
  filmGrainIntensity: number,
  pageGlowEnabled: boolean,
  pageGlowIntensity: number,
) {
  document.documentElement.dataset.filmGrainEnabled = filmGrainEnabled ? "true" : "false";
  document.documentElement.dataset.pageGlowEnabled = pageGlowEnabled ? "true" : "false";
  document.documentElement.style.setProperty(
    "--dev-film-grain-opacity",
    String(filmGrainEnabled ? filmGrainOpacity(filmGrainIntensity) : 0),
  );
  document.documentElement.style.setProperty(
    "--dev-page-glow-opacity",
    String(pageGlowEnabled ? pageGlowOpacity(pageGlowIntensity) : 0),
  );
}

export function clearAtmosphereVars() {
  delete document.documentElement.dataset.filmGrainEnabled;
  delete document.documentElement.dataset.pageGlowEnabled;
  document.documentElement.style.removeProperty("--dev-film-grain-opacity");
  document.documentElement.style.removeProperty("--dev-page-glow-opacity");
}
