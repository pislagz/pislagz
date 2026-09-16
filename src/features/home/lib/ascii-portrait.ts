import {
  createAsciiPortraitEngine,
  fitPortraitLayout,
  imageSourceFromElement,
  type AsciiPortraitEngineHandle,
} from "./ascii-portrait-engine";

const MOBILE_BREAKPOINT = 900;
const RESIZE_DEBOUNCE_MS = 180;

function createPortraitResizeController({
  glowCanvas,
  glyphCanvas,
  imageAspect,
  getSize,
  rebuild,
}: {
  glowCanvas: HTMLCanvasElement;
  glyphCanvas: HTMLCanvasElement;
  imageAspect: number;
  getSize: () => { width: number; height: number };
  rebuild: () => void;
}) {
  let resizeTimer = 0;
  let wasMobile = getSize().width < MOBILE_BREAKPOINT;

  const applyLayoutNow = () => {
    const { width, height } = getSize();
    if (width < 8 || height < 8) return undefined;

    const mobile = width < MOBILE_BREAKPOINT;
    const fitted = fitPortraitLayout(width, height, imageAspect);
    if (fitted.width < 8 || fitted.height < 8) return undefined;

    applyPortraitCanvasLayout(glowCanvas, glyphCanvas, fitted.width, fitted.height, mobile);
    return mobile;
  };

  const onResize = () => {
    const mobile = applyLayoutNow();
    if (mobile === undefined) return;

    const crossBreakpoint = mobile !== wasMobile;
    wasMobile = mobile;

    if (resizeTimer) window.clearTimeout(resizeTimer);

    const runRebuild = () => {
      requestAnimationFrame(rebuild);
    };

    if (crossBreakpoint) {
      runRebuild();
      return;
    }

    resizeTimer = window.setTimeout(runRebuild, RESIZE_DEBOUNCE_MS);
  };

  return {
    onResize,
    clear() {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = 0;
    },
  };
}

export function applyPortraitCanvasLayout(
  glowCanvas: HTMLCanvasElement,
  glyphCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  mobile: boolean,
) {
  for (const canvas of [glowCanvas, glyphCanvas]) {
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.aspectRatio = `${width} / ${height}`;
    canvas.style.top = "50%";
    canvas.style.bottom = "auto";

    if (mobile) {
      canvas.style.left = "50%";
      canvas.style.right = "auto";
      canvas.style.transform = "translate(-50%, -50%)";
    } else {
      canvas.style.left = "auto";
      canvas.style.right = "0";
      canvas.style.transform = "translateY(-50%)";
    }
  }
}

export type AsciiPortraitHandle = {
  destroy: () => void;
  setReducedMotion: (value: boolean) => void;
  setPointer: (x: number, y: number, active: boolean) => void;
};

type Options = {
  reducedMotion: boolean;
  onReady?: () => void;
  onGlyphEnter?: () => void;
  getSize?: () => { width: number; height: number };
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
  let resizeController: ReturnType<typeof createPortraitResizeController> | null = null;
  let ready = false;
  let readyTimeout = 0;
  const imageAspect = image.naturalWidth / image.naturalHeight;

  const cleanup = () => {
    destroyed = true;
    ready = false;
    resizeController?.clear();
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

  const onVisibility = () => {
    worker?.postMessage({ type: "visibility", hidden: document.hidden });
  };

  const handle: AsciiPortraitHandle = {
    setReducedMotion(value: boolean) {
      worker?.postMessage({ type: "setReducedMotion", value });
    },
    setPointer(x: number, y: number, active: boolean) {
      worker?.postMessage({ type: "pointer", x, y, active });
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
    worker!.onmessage = (
      event: MessageEvent<{
        type: string;
        width?: number;
        height?: number;
        mobile?: boolean;
      }>,
    ) => {
      if (destroyed) return;

      if (event.data.type === "layout") {
        const { width = 0, height = 0, mobile = false } = event.data;
        if (width > 0 && height > 0) {
          applyPortraitCanvasLayout(glowCanvas, glyphCanvas, width, height, mobile);
        }
        return;
      }

      if (event.data.type === "glyphEnter") {
        options.onGlyphEnter?.();
        return;
      }

      if (event.data.type !== "ready") return;
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

        resizeController = createPortraitResizeController({
          glowCanvas,
          glyphCanvas,
          imageAspect,
          getSize: options.getSize,
          rebuild: postResize,
        });

        const resizeTarget = glowCanvas.parentElement?.parentElement ?? glowCanvas.parentElement;
        if (resizeTarget) {
          resizeObserver = new ResizeObserver(() => {
            if (!destroyed) resizeController?.onResize();
          });
          resizeObserver.observe(resizeTarget);
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
    {
      reducedMotion: options.reducedMotion,
      onReady: options.onReady,
      onGlyphEnter: options.onGlyphEnter,
      onLayout: (width, height, mobile) => {
        applyPortraitCanvasLayout(glowCanvas, glyphCanvas, width, height, mobile);
      },
    },
  );

  let resizeObserver: ResizeObserver | null = null;
  const imageAspect = image.naturalWidth / image.naturalHeight;

  const measure = () => {
    const { width, height } = options.getSize?.() ?? {
      width: glowCanvas.clientWidth,
      height: glowCanvas.clientHeight,
    };
    if (width < 8 || height < 8) return;
    engine?.setSize(width, height);
  };

  const resizeController = createPortraitResizeController({
    glowCanvas,
    glyphCanvas,
    imageAspect,
    getSize: () =>
      options.getSize?.() ?? {
        width: glowCanvas.clientWidth,
        height: glowCanvas.clientHeight,
      },
    rebuild: measure,
  });

  const onVisibility = () => {
    engine?.setHidden(document.hidden);
  };

  const resizeTarget = glowCanvas.parentElement?.parentElement ?? glowCanvas.parentElement;
  if (resizeTarget) {
    resizeObserver = new ResizeObserver(() => resizeController.onResize());
    resizeObserver.observe(resizeTarget);
  }
  document.addEventListener("visibilitychange", onVisibility);
  resizeController.onResize();
  requestAnimationFrame(() => measure());

  return {
    setReducedMotion(value: boolean) {
      engine?.setReducedMotion(value);
    },
    setPointer(x: number, y: number, active: boolean) {
      engine?.setPointer(x, y, active);
    },
    destroy() {
      resizeController.clear();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engine?.destroy();
      engine = null;
    },
  };
}
