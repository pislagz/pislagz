export type CrystalRgb = [number, number, number];

export type CrystalPalette = {
  a: CrystalRgb;
  b: CrystalRgb;
  c: CrystalRgb;
};

export const CRYSTAL_PALETTES = {
  home: {
    a: [0.15, 0.45, 1.0],
    b: [0.55, 0.08, 1.0],
    c: [0.85, 0.05, 1.0],
  },
  arsenal: {
    a: [1.0, 0.38, 0.02],
    b: [1.0, 0.58, 0.06],
    c: [1.0, 0.86, 0.22],
  },
  play: {
    a: [0.08, 0.08, 0.08],
    b: [0.32, 0.32, 0.32],
    c: [0.72, 0.72, 0.72],
  },
  resume: {
    a: [0.12, 1.35, 0.0],
    b: [0.45, 1.55, 0.05],
    c: [0.9, 1.7, 0.18],
  },
  hire: {
    a: [0.0, 0.85, 1.45],
    b: [0.2, 1.15, 1.65],
    c: [0.55, 1.35, 1.8],
  },
} satisfies Record<string, CrystalPalette>;
