export type PageTheme = {
  accent: string;
  accentDeep: string;
  logoFrom: string;
  logoTo: string;
  shadowNav: string;
  underline: string;
  skillFilter: string;
};

export const PAGE_THEMES = {
  home: {
    accent: "#af06ff",
    accentDeep: "#4503ff",
    logoFrom: "#CC18CF",
    logoTo: "#4E0CA2",
    shadowNav: "0 10px 30px #af06ff",
    underline: "#700dff",
    skillFilter: "none",
  },
  skills: {
    accent: "#ff6b00",
    accentDeep: "#ff2a00",
    logoFrom: "#FF8A1A",
    logoTo: "#D91F00",
    shadowNav: "0 10px 30px #ff6b00",
    underline: "#ff4d00",
    skillFilter: "hue-rotate(118deg) saturate(1.25)",
  },
  resume: {
    accent: "#2dff4e",
    accentDeep: "#00b33c",
    logoFrom: "#7CFF3A",
    logoTo: "#009E32",
    shadowNav: "0 10px 30px #2dff4e",
    underline: "#1ad94a",
    skillFilter: "none",
  },
  hire: {
    accent: "#3ecbff",
    accentDeep: "#0088ff",
    logoFrom: "#6AE0FF",
    logoTo: "#0077FF",
    shadowNav: "0 10px 30px #3ecbff",
    underline: "#2bb4ff",
    skillFilter: "none",
  },
} as const satisfies Record<string, PageTheme>;

export function themeForPath(pathname: string): PageTheme {
  if (pathname.startsWith("/skills")) return PAGE_THEMES.skills;
  if (pathname.startsWith("/resume")) return PAGE_THEMES.resume;
  if (pathname.startsWith("/hire-me")) return PAGE_THEMES.hire;
  return PAGE_THEMES.home;
}
