import { synthesizeBootSound } from "./boot-sound";
import { synthesizeDecipherSound } from "./decipher-sound";
import { synthesizeMailSwooshSound } from "./mail-swoosh-sound";
import { getArcadeAudioContext, unlockArcadeAudio } from "./arcade-audio";

export type RouteEntranceSoundId = "arsenal" | "hire-me" | "resume";

const playedThisSession = new Set<RouteEntranceSoundId>();

let activeStop: (() => void) | null = null;
let pendingPlay: { cancel: () => void } | null = null;
let playGeneration = 0;

const COMMIT_DELAY_MS = 300;

const synthesizers: Record<
  RouteEntranceSoundId,
  (audio: AudioContext) => () => void
> = {
  arsenal: synthesizeBootSound,
  "hire-me": synthesizeMailSwooshSound,
  resume: synthesizeDecipherSound,
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stopActiveSound() {
  if (!activeStop) return;
  activeStop();
  activeStop = null;
}

function cancelPendingPlay() {
  pendingPlay?.cancel();
  pendingPlay = null;
}

function playSound(
  id: RouteEntranceSoundId,
  generation: number,
  isCancelled: () => boolean,
  onGesture: () => void,
  allowCreate = true,
) {
  if (isCancelled() || playedThisSession.has(id)) return;

  const audio = getArcadeAudioContext(allowCreate);
  if (!audio) return;

  const startSynth = () => {
    if (isCancelled() || audio.state !== "running" || playedThisSession.has(id)) {
      return;
    }

    pendingPlay = null;
    stopActiveSound();
    activeStop = synthesizers[id](audio);

    window.setTimeout(() => {
      if (!isCancelled()) playedThisSession.add(id);
    }, COMMIT_DELAY_MS);
  };

  if (audio.state !== "running") {
    if (allowCreate && audio.state === "suspended") {
      void audio.resume().then(() =>
        playSound(id, generation, isCancelled, onGesture, false),
      );
      document.addEventListener("pointerdown", onGesture, { once: true });
    }
    return;
  }

  startSynth();
}

export function playRouteEntranceSound(id: RouteEntranceSoundId) {
  if (prefersReducedMotion()) return () => undefined;
  if (playedThisSession.has(id)) return () => undefined;

  const generation = ++playGeneration;
  let cancelled = false;
  const isCancelled = () => cancelled || playGeneration !== generation;

  const onGesture = () => {
    if (isCancelled() || playedThisSession.has(id)) return;
    unlockArcadeAudio();
    playSound(id, generation, isCancelled, onGesture, false);
  };

  const cancel = () => {
    if (playGeneration !== generation) return;
    cancelled = true;
    document.removeEventListener("pointerdown", onGesture);

    if (pendingPlay?.cancel === cancel) {
      pendingPlay = null;
    }

    stopActiveSound();
  };

  cancelPendingPlay();
  pendingPlay = { cancel };

  unlockArcadeAudio();
  playSound(id, generation, isCancelled, onGesture);

  return cancel;
}
