import {
  createAsciiPortraitEngine,
  imageSourceFromElement,
  type AsciiPortraitEngineHandle,
} from "./ascii-portrait-engine";

export type AsciiPortraitHandle = {
  destroy: () => void;
  setReducedMotion: (value: boolean) => void;
};

type Options = {
  reducedMotion: boolean;
  onReady?: () => void;
};

const WORKER_READY_MS = 12_000;

/**
 * Drop-in portrait. Replace this file with your photo:
 * `public/assets/home/portrait.png` (jpg / webp also work if the png is removed).
 */
export const PORTRAIT_SOURCES = [
  "/assets/home/portrait.png",
  "/assets/home/portrait.jpg",
  "/assets/home/portrait.webp",
] as const;

function tryLoad(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image.naturalWidth > 0 ? image : null);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

let portraitImagePromise: Promise<HTMLImageElement | null> | null = null;

export function loadPortraitImage(): Promise<HTMLImageElement | null> {
  if (!portraitImagePromise) {
    portraitImagePromise = (async () => {
      for (const src of PORTRAIT_SOURCES) {
        const image = await tryLoad(src);
        if (image) return image;
      }
      return null;
    })();
  }
  return portraitImagePromise;
}

export function supportsAsciiPortraitWorker() {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
  );
}

type WorkerOptions = Options & {
  getSize: () => { width: number; height: number };
};

function postTransfer(
  worker: Worker,
  message: Record<string, unknown>,
  transfer: Transferable[],
) {
  worker.postMessage(message, transfer);
}

export function tryCreateAsciiPortraitWorker(
  glowCanvas: HTMLCanvasElement,
  glyphCanvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: WorkerOptions,
): Promise<AsciiPortraitHandle | null> {
  if (!supportsAsciiPortraitWorker()) return Promise.resolve(null);

  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL("./ascii-portrait.worker.ts", import.meta.url));
  } catch {
    return Promise.resolve(null);
  }

  let destroyed = false;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer = 0;
  let ready = false;
  let readyTimeout = 0;

  const cleanup = () => {
    destroyed = true;
    ready = false;
    if (resizeTimer) window.clearTimeout(resizeTimer);
    if (readyTimeout) window.clearTimeout(readyTimeout);
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    worker?.postMessage({ type: "destroy" });
    worker?.terminate();
    worker = null;
  };

  const postResize = () => {
    if (destroyed || !ready || !worker) return;
    const { width, height } = options.getSize();
    if (width < 8 || height < 8) return;
    worker.postMessage({ type: "resize", width, height });
  };

  const scheduleResize = () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      postResize();
    }, 180);
  };

  const onVisibility = () => {
    worker?.postMessage({ type: "visibility", hidden: document.hidden });
  };

  const handle: AsciiPortraitHandle = {
    setReducedMotion(value: boolean) {
      worker?.postMessage({ type: "setReducedMotion", value });
    },
    destroy() {
      cleanup();
    },
  };

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: AsciiPortraitHandle | null) => {
      if (settled) return;
      settled = true;
      if (readyTimeout) window.clearTimeout(readyTimeout);
      if (!value) cleanup();
      resolve(value);
    };

    readyTimeout = window.setTimeout(() => settle(null), WORKER_READY_MS);

    worker!.onerror = () => settle(null);
    worker!.onmessageerror = () => settle(null);
    worker!.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type !== "ready" || destroyed) return;
      ready = true;
      options.onReady?.();
      postResize();
      settle(handle);
    };

    void (async () => {
      try {
        const bitmap = await createImageBitmap(image);
        if (destroyed) {
          bitmap.close();
          settle(null);
          return;
        }

        const { width, height } = options.getSize();
        if (width < 8 || height < 8) {
          bitmap.close();
          settle(null);
          return;
        }

        const glow = glowCanvas.transferControlToOffscreen();
        const glyph = glyphCanvas.transferControlToOffscreen();

        postTransfer(
          worker!,
          {
            type: "canvases",
            glow,
            glyph,
            width,
            height,
            reducedMotion: options.reducedMotion,
          },
          [glow, glyph],
        );

        postTransfer(worker!, { type: "bitmap", bitmap }, [bitmap]);

        const parent = glowCanvas.parentElement;
        if (parent) {
          resizeObserver = new ResizeObserver(() => scheduleResize());
          resizeObserver.observe(parent);
        }
        document.addEventListener("visibilitychange", onVisibility);
      } catch {
        settle(null);
      }
    })();
  });
}

export function createAsciiPortrait(
  glowCanvas: HTMLCanvasElement,
  glyphCanvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: Options,
): AsciiPortraitHandle {
  let engine: AsciiPortraitEngineHandle | null = createAsciiPortraitEngine(
    glowCanvas,
    glyphCanvas,
    imageSourceFromElement(image),
    options,
  );

  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer = 0;

  const measure = () => {
    const width = glowCanvas.clientWidth;
    const height = glowCanvas.clientHeight;
    if (width < 8 || height < 8) return;
    engine?.setSize(width, height);
  };

  const scheduleMeasure = () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      measure();
    }, 180);
  };

  const onVisibility = () => {
    engine?.setHidden(document.hidden);
  };

  resizeObserver = new ResizeObserver(() => scheduleMeasure());
  resizeObserver.observe(glowCanvas);
  document.addEventListener("visibilitychange", onVisibility);
  requestAnimationFrame(() => measure());

  return {
    setReducedMotion(value: boolean) {
      engine?.setReducedMotion(value);
    },
    destroy() {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engine?.destroy();
      engine = null;
    },
  };
}
