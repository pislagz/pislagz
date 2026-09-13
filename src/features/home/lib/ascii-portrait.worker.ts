/// <reference lib="webworker" />

import {
  createAsciiPortraitEngine,
  imageSourceFromBitmap,
  type AsciiPortraitEngineHandle,
} from "./ascii-portrait-engine";

type CanvasesMessage = {
  type: "canvases";
  glow: OffscreenCanvas;
  glyph: OffscreenCanvas;
  width: number;
  height: number;
  reducedMotion: boolean;
};

type BitmapMessage = {
  type: "bitmap";
  bitmap: ImageBitmap;
};

type WorkerMessage =
  | CanvasesMessage
  | BitmapMessage
  | { type: "resize"; width: number; height: number }
  | { type: "setReducedMotion"; value: boolean }
  | { type: "visibility"; hidden: boolean }
  | { type: "destroy" };

let handle: AsciiPortraitEngineHandle | null = null;
let pendingGlow: OffscreenCanvas | null = null;
let pendingGlyph: OffscreenCanvas | null = null;
let pendingBitmap: ImageBitmap | null = null;
let pendingWidth = 0;
let pendingHeight = 0;
let pendingReducedMotion = false;

function tryStart() {
  if (!pendingGlow || !pendingGlyph || !pendingBitmap) return;

  handle?.destroy();
  const image = imageSourceFromBitmap(pendingBitmap);
  handle = createAsciiPortraitEngine(pendingGlow, pendingGlyph, image, {
    reducedMotion: pendingReducedMotion,
    onReady: () => self.postMessage({ type: "ready" }),
    onLayout: (width, height, mobile) => {
      self.postMessage({ type: "layout", width, height, mobile });
    },
  });
  handle.setSize(pendingWidth, pendingHeight);

  pendingBitmap = null;
  pendingGlow = null;
  pendingGlyph = null;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "canvases":
      pendingGlow = message.glow;
      pendingGlyph = message.glyph;
      pendingWidth = message.width;
      pendingHeight = message.height;
      pendingReducedMotion = message.reducedMotion;
      tryStart();
      break;
    case "bitmap":
      pendingBitmap = message.bitmap;
      tryStart();
      break;
    case "resize":
      handle?.setSize(message.width, message.height);
      break;
    case "setReducedMotion":
      handle?.setReducedMotion(message.value);
      break;
    case "visibility":
      handle?.setHidden(message.hidden);
      break;
    case "destroy":
      handle?.destroy();
      handle = null;
      pendingGlow = null;
      pendingGlyph = null;
      if (pendingBitmap) {
        pendingBitmap.close();
        pendingBitmap = null;
      }
      break;
    default:
      break;
  }
};
