export type PortraitImageSource = {
  width: number;
  height: number;
  draw: (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    dest: { x: number; y: number; w: number; h: number },
  ) => void;
  dispose?: () => void;
};

export type EngineOptions = {
  reducedMotion: boolean;
  onReady?: () => void;
};

export type AsciiPortraitEngineHandle = {
  destroy: () => void;
  setReducedMotion: (value: boolean) => void;
  setSize: (width: number, height: number) => void;
  setHidden: (hidden: boolean) => void;
};

type Cell = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  color: string;
  glyph: string;
  rampIndex: number;
  opacity: number;
};

type RuntimeProfile = {
  dprCap: number;
  maxGridCells: number;
  boilMs: number;
  swapFraction: number;
};

type PortraitCanvas = OffscreenCanvas | HTMLCanvasElement;
type PortraitContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function getPortraitContext(canvas: PortraitCanvas): PortraitContext | null {
  return canvas.getContext("2d", { alpha: true, desynchronized: true }) as PortraitContext | null;
}

const GLYPH_BUCKETS: readonly string[] = [
  " ·･.",
  ":-_=~",
  "'\"`",
  ",;!",
  "|\\/<>",
  "0123456789",
  "()[]{}",
  "?",
  "+-*×÷",
  "=#%@",
  "$&§",
  "アイウエオ",
  "カキクケコ",
  "サシスセソ",
  "タチツテト",
  "ナニヌネノ",
  "ハヒフヘホ",
  "マミムメモ",
  "ヤユヨ",
  "ラリルレロ",
  "ワヲン",
  "ガギグゲゴ",
  "ザジズゼゾ",
  "ダヂヅデド",
  "バビブベボ",
  "パピプペポ",
  "ャュョッ",
];

const TINT = { r: 196, g: 28, b: 255 };
const TINT_AMOUNT = 0.16;
const LIFT = 20;
const CONTRAST = 1.58;
const RESIZE_DEBOUNCE_MS = 180;
const RAMP_JITTER = 2;
const BOTTOM_FADE_ROWS = 6;
const MOBILE_BOTTOM_FADE_ROWS = 10;

function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\//i.test(ua);
}

function runtimeProfile(): RuntimeProfile {
  return {
    dprCap: isSafari() ? 1.2 : 1.25,
    maxGridCells: 4200,
    boilMs: 50,
    swapFraction: 0.075,
  };
}

export function imageSourceFromElement(image: HTMLImageElement): PortraitImageSource {
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    draw(ctx, dest) {
      ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, dest.x, dest.y, dest.w, dest.h);
    },
  };
}

export function imageSourceFromBitmap(bitmap: ImageBitmap): PortraitImageSource {
  return {
    width: bitmap.width,
    height: bitmap.height,
    draw(ctx, dest) {
      ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, dest.x, dest.y, dest.w, dest.h);
    },
    dispose() {
      bitmap.close();
    },
  };
}

function clampByte(value: number) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

function lumaOf(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function processPixel(r: number, g: number, b: number, a: number) {
  if (a < 24) return null;

  const luma = lumaOf(r, g, b);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.04 && luma > 245) return null;

  const isShadow = luma < 52;
  const tintAmount = isShadow ? TINT_AMOUNT * 0.45 : TINT_AMOUNT;
  const lift = isShadow ? 6 : LIFT;
  const contrast = isShadow ? 1.18 : CONTRAST;

  const tintedR = r * (1 - tintAmount) + TINT.r * tintAmount;
  const tintedG = g * (1 - tintAmount) + TINT.g * tintAmount;
  const tintedB = b * (1 - tintAmount) + TINT.b * tintAmount;
  const contrastR = (tintedR - 128) * contrast + 128 + lift;
  const contrastG = (tintedG - 128) * contrast + 128 + lift;
  const contrastB = (tintedB - 128) * contrast + 128 + lift;
  let outR = clampByte(contrastR);
  let outG = clampByte(contrastG);
  let outB = clampByte(contrastB);

  if (isShadow) {
    outR = clampByte(Math.max(outR, 34));
    outG = clampByte(Math.max(outG, 10));
    outB = clampByte(Math.max(outB, 42));
  }

  const outLuma = lumaOf(outR, outG, outB);
  const shaped = Math.pow(Math.max(outLuma, 6) / 255, 0.58);
  const rampIndex = Math.min(
    GLYPH_BUCKETS.length - 1,
    Math.max(0, Math.floor(shaped * (GLYPH_BUCKETS.length - 1))),
  );
  return { r: outR, g: outG, b: outB, rampIndex };
}

function pickFromBucket(index: number) {
  const bucket = GLYPH_BUCKETS[index] ?? GLYPH_BUCKETS[GLYPH_BUCKETS.length - 1] ?? "#";
  return bucket[(Math.random() * bucket.length) | 0] ?? "#";
}

function glyphNear(index: number) {
  const lo = Math.max(0, index - RAMP_JITTER);
  const hi = Math.min(GLYPH_BUCKETS.length - 1, index + RAMP_JITTER);
  const bucketIndex = lo + ((Math.random() * (hi - lo + 1)) | 0);
  return pickFromBucket(bucketIndex);
}

function applyBottomFade(cells: Cell[], cellH: number, fadeRows = BOTTOM_FADE_ROWS) {
  if (!cells.length) return;

  let bottomY = cells[0].y;
  for (let i = 1; i < cells.length; i += 1) {
    bottomY = Math.max(bottomY, cells[i].y);
  }

  const fadeHeight = cellH * fadeRows;
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const distFromBottom = bottomY - cell.y;
    cell.opacity =
      distFromBottom >= fadeHeight
        ? 1
        : Math.pow(Math.max(0, distFromBottom / fadeHeight), 0.82);
  }
}

function figureRect(
  imgW: number,
  imgH: number,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  alignX: number,
  alignY: number,
) {
  const imgAspect = imgW / imgH;
  const cellAspect = cellW / cellH;
  const gridAspect = (cols * cellAspect) / rows;
  const fill = 0.9;

  let figureCols: number;
  let figureRows: number;
  if (imgAspect > gridAspect) {
    figureCols = cols * fill;
    figureRows = (figureCols * cellAspect) / imgAspect;
  } else {
    figureRows = rows * fill;
    figureCols = (figureRows * imgAspect) / cellAspect;
  }

  return {
    x: (cols - figureCols) * alignX,
    y: (rows - figureRows) * alignY,
    w: figureCols,
    h: figureRows,
  };
}

function measureGrid(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  fontStack: string,
  maxGridCells: number,
) {
  let fontSize = width < 520 ? 7 : width < 900 ? 8 : 9;
  let cellW = 6;
  let cellH = 8;
  let cols = 8;
  let rows = 8;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    ctx.font = `${fontSize}px ${fontStack}`;
    cellW = Math.max(5, Math.round(Math.max(ctx.measureText("M").width, ctx.measureText("ア").width)));
    cellH = Math.round(fontSize * 1.08);
    cols = Math.max(8, Math.floor(width / cellW));
    rows = Math.max(8, Math.floor(height / cellH));
    if (cols * rows <= maxGridCells) break;
    fontSize += 1;
  }

  return { fontSize, cellW, cellH, cols, rows };
}

function createSampleCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createAsciiPortraitEngine(
  glowCanvas: PortraitCanvas,
  glyphCanvas: PortraitCanvas,
  image: PortraitImageSource,
  options: EngineOptions,
): AsciiPortraitEngineHandle {
  const glowCtx = getPortraitContext(glowCanvas);
  const glyphCtx = getPortraitContext(glyphCanvas);
  if (!glowCtx || !glyphCtx) {
    return {
      destroy() {},
      setReducedMotion() {},
      setSize() {},
      setHidden() {},
    };
  }

  const profile = runtimeProfile();
  const fontStack =
    'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

  let running = true;
  let reducedMotion = options.reducedMotion;
  let pageHidden = false;
  let cells: Cell[] = [];
  let fontSize = 10;
  let cellW = 6;
  let cellH = 8;
  let layoutWidth = 0;
  let layoutHeight = 0;
  let renderWidth = 0;
  let renderHeight = 0;
  let renderDpr = 0;
  let gridCols = 0;
  let gridRows = 0;
  let announcedReady = false;
  let resizeTimer = 0;
  let boilTimer = 0;
  let isMobileLayout = false;
  let sampleCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  let sampleCtx: PortraitContext | null = null;

  const syncCanvasBitmap = () => {
    const bitmapW = Math.max(1, Math.round(renderWidth * renderDpr));
    const bitmapH = Math.max(1, Math.round(renderHeight * renderDpr));
    glowCanvas.width = bitmapW;
    glowCanvas.height = bitmapH;
    glyphCanvas.width = bitmapW;
    glyphCanvas.height = bitmapH;
    glowCtx.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);
    glyphCtx.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);
  };

  const buildGlowLayer = () => {
    glowCtx.clearRect(0, 0, renderWidth, renderHeight);
    const radius = Math.max(fontSize * 0.62, 3);
    const glowMul = isMobileLayout ? 1.4 : 1;

    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const cx = cell.x + cellW * 0.5;
      const cy = cell.y + cellH * 0.78;
      const alpha = cell.opacity;
      const grad = glowCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${cell.r},${cell.g},${cell.b},${Math.min(1, 0.55 * alpha * glowMul)})`);
      grad.addColorStop(0.45, `rgba(${cell.r},${cell.g},${cell.b},${Math.min(1, 0.2 * alpha * glowMul)})`);
      grad.addColorStop(1, `rgba(${cell.r},${cell.g},${cell.b},0)`);
      glowCtx.fillStyle = grad;
      glowCtx.beginPath();
      glowCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      glowCtx.fill();
    }
  };

  const paintGlyphs = (dirty?: Cell[]) => {
    glyphCtx.font = `${fontSize}px ${fontStack}`;
    glyphCtx.textBaseline = "top";
    glyphCtx.textAlign = "left";

    const drawCell = (cell: Cell) => {
      glyphCtx.globalAlpha = cell.opacity;
      glyphCtx.fillStyle = cell.color;
      glyphCtx.fillText(cell.glyph, cell.x, cell.y);
      glyphCtx.globalAlpha = 1;
    };

    if (!dirty) {
      glyphCtx.clearRect(0, 0, renderWidth, renderHeight);
      for (let i = 0; i < cells.length; i += 1) drawCell(cells[i]);
      return;
    }

    const padX = cellW + 1;
    const padY = cellH + 1;
    for (let i = 0; i < dirty.length; i += 1) {
      const cell = dirty[i];
      glyphCtx.clearRect(cell.x, cell.y, padX, padY);
      drawCell(cell);
    }
  };

  const startBoil = () => {
    if (boilTimer || reducedMotion || !running || pageHidden) return;
    boilTimer = setInterval(boil, profile.boilMs) as unknown as number;
  };

  const stopBoil = () => {
    if (!boilTimer) return;
    clearInterval(boilTimer);
    boilTimer = 0;
  };

  const announceReady = () => {
    if (announcedReady) return;
    announcedReady = true;
    options.onReady?.();
    startBoil();
  };

  const finishPaint = () => {
    if (!running) return;
    syncCanvasBitmap();
    buildGlowLayer();
    paintGlyphs();
    announceReady();
  };

  const rebuild = () => {
    if (!running) return;

    const width = layoutWidth;
    const height = layoutHeight;
    if (width < 8 || height < 8) return;

    isMobileLayout = width < 900;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, profile.dprCap);
    const grid = measureGrid(glyphCtx, width, height, fontStack, profile.maxGridCells);
    const { cols, rows } = grid;
    cellW = grid.cellW;
    cellH = grid.cellH;

    const sizeChanged = width !== renderWidth || height !== renderHeight || dpr !== renderDpr;
    const gridChanged = cols !== gridCols || rows !== gridRows || grid.fontSize !== fontSize;
    if (!sizeChanged && !gridChanged && cells.length) return;

    renderWidth = width;
    renderHeight = height;
    renderDpr = dpr;
    gridCols = cols;
    gridRows = rows;
    fontSize = grid.fontSize;

    if (!gridChanged && cells.length) {
      if (sizeChanged) finishPaint();
      else paintGlyphs();
      return;
    }

    if (!sampleCanvas || !sampleCtx) {
      sampleCanvas = createSampleCanvas(cols, rows);
      sampleCtx = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
        alpha: true,
      }) as PortraitContext | null;
      if (!sampleCtx) return;
    }

    sampleCanvas.width = cols;
    sampleCanvas.height = rows;
    sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    sampleCtx.clearRect(0, 0, cols, rows);
    sampleCtx.imageSmoothingEnabled = true;
    sampleCtx.imageSmoothingQuality = "medium";

    const alignX = isMobileLayout ? 0.5 : width > height * 0.9 ? 0.88 : 0.5;
    const alignY = isMobileLayout ? 0.45 : 0.35;
    const dest = figureRect(image.width, image.height, cols, rows, cellW, cellH, alignX, alignY);
    image.draw(sampleCtx, dest);

    const pixels = sampleCtx.getImageData(0, 0, cols, rows).data;
    const next: Cell[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const i = (row * cols + col) * 4;
        const processed = processPixel(
          pixels[i] ?? 0,
          pixels[i + 1] ?? 0,
          pixels[i + 2] ?? 0,
          pixels[i + 3] ?? 0,
        );
        if (!processed) continue;
        const ir = processed.r | 0;
        const ig = processed.g | 0;
        const ib = processed.b | 0;
        next.push({
          x: col * cellW,
          y: row * cellH,
          r: ir,
          g: ig,
          b: ib,
          color: `rgb(${ir},${ig},${ib})`,
          rampIndex: processed.rampIndex,
          glyph: pickFromBucket(processed.rampIndex),
          opacity: 1,
        });
      }
    }

    applyBottomFade(next, cellH, isMobileLayout ? MOBILE_BOTTOM_FADE_ROWS : BOTTOM_FADE_ROWS);
    cells = next;
    finishPaint();
  };

  const boil = () => {
    if (!cells.length || reducedMotion || pageHidden) return;
    const count = Math.max(1, (cells.length * profile.swapFraction) | 0);
    const dirty: Cell[] = [];
    for (let i = 0; i < count; i += 1) {
      const cell = cells[(Math.random() * cells.length) | 0];
      if (!cell) continue;
      cell.glyph = glyphNear(cell.rampIndex);
      dirty.push(cell);
    }
    paintGlyphs(dirty);
  };

  const scheduleRebuild = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = 0;
      rebuild();
    }, RESIZE_DEBOUNCE_MS) as unknown as number;
  };

  return {
    setSize(width: number, height: number) {
      const unchanged = width === layoutWidth && height === layoutHeight;
      if (unchanged && cells.length) return;
      layoutWidth = width;
      layoutHeight = height;
      if (!cells.length) {
        rebuild();
        return;
      }
      scheduleRebuild();
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value;
      if (reducedMotion) stopBoil();
      else startBoil();
    },
    setHidden(hidden: boolean) {
      pageHidden = hidden;
      if (pageHidden) stopBoil();
      else startBoil();
    },
    destroy() {
      running = false;
      stopBoil();
      if (resizeTimer) clearTimeout(resizeTimer);
      image.dispose?.();
    },
  };
}
