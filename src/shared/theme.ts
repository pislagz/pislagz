export type PageTheme = {
  accent: string;
  accentDeep: string;
  logoFrom: string;
  logoTo: string;
  shadowNav: string;
  underline: string;
  arsenalIconFilter: string;
};

export const PAGE_THEMES = {
  home: {
    accent: "#af06ff",
    accentDeep: "#4503ff",
    logoFrom: "#CC18CF",
    logoTo: "#4E0CA2",
    shadowNav: "0 10px 30px #af06ff",
    underline: "#700dff",
    arsenalIconFilter: "none",
  },
  arsenal: {
    accent: "#ff6b00",
    accentDeep: "#ff2a00",
    logoFrom: "#FF8A1A",
    logoTo: "#D91F00",
    shadowNav: "0 10px 30px #ff6b00",
    underline: "#ff4d00",
    arsenalIconFilter: "hue-rotate(118deg) saturate(1.25)",
  },
  play: {
    accent: "#ffffff",
    accentDeep: "#777777",
    logoFrom: "#050505",
    logoTo: "#171717",
    shadowNav: "0 10px 30px rgba(255, 255, 255, 0.28)",
    underline: "#ffffff",
    arsenalIconFilter: "none",
  },
  resume: {
    accent: "#2dff4e",
    accentDeep: "#00b33c",
    logoFrom: "#7CFF3A",
    logoTo: "#009E32",
    shadowNav: "0 10px 30px #2dff4e",
    underline: "#1ad94a",
    arsenalIconFilter: "none",
  },
  hire: {
    accent: "#3ecbff",
    accentDeep: "#0088ff",
    logoFrom: "#6AE0FF",
    logoTo: "#0077FF",
    shadowNav: "0 10px 30px #3ecbff",
    underline: "#2bb4ff",
    arsenalIconFilter: "none",
  },
} as const satisfies Record<string, PageTheme>;

export function themeForPath(pathname: string): PageTheme {
  if (pathname.startsWith("/arsenal")) return PAGE_THEMES.arsenal;
  if (pathname.startsWith("/play")) return PAGE_THEMES.play;
  if (pathname.startsWith("/resume")) return PAGE_THEMES.resume;
  if (pathname.startsWith("/hire-me")) return PAGE_THEMES.hire;
  return PAGE_THEMES.home;
}
