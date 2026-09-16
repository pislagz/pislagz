export type ArcadeSound =
  | "arrival"
  | "shoot"
  | "blaster"
  | "hit"
  | "bounce"
  | "power"
  | "deny"
  | "timing-early"
  | "timing-late"
  | "score"
  | "wave-clear"
  | "game-over"
  | "select"
  | "countdown-3"
  | "countdown-2"
  | "countdown-1"
  | "countdown-go"
  | "navigate";

let arcadeAudioContext: AudioContext | null = null;
const audioStateListeners = new Set<(running: boolean) => void>();

function notifyAudioState() {
  const running = arcadeAudioContext?.state === "running";
  audioStateListeners.forEach((listener) => listener(running));
}

function watchAudioContext(audio: AudioContext) {
  audio.addEventListener("statechange", notifyAudioState);
}

export function getArcadeAudioContext(allowCreate = true) {
  if (!arcadeAudioContext && allowCreate) {
    arcadeAudioContext = new AudioContext();
    watchAudioContext(arcadeAudioContext);
    notifyAudioState();
  }
  return arcadeAudioContext;
}

export function isArcadeAudioRunning() {
  return arcadeAudioContext?.state === "running";
}

export function subscribeArcadeAudioState(listener: (running: boolean) => void) {
  audioStateListeners.add(listener);
  listener(isArcadeAudioRunning());
  return () => {
    audioStateListeners.delete(listener);
  };
}

function resumeArcadeAudio() {
  const audio = getArcadeAudioContext();
  if (!audio) return Promise.resolve();
  if (audio.state === "running") {
    notifyAudioState();
    return Promise.resolve();
  }
  return audio.resume().then(() => notifyAudioState());
}

export function unlockArcadeAudio() {
  void resumeArcadeAudio();
}

export function playArcadeSound(sound: ArcadeSound, allowCreate = true) {
  const audio = getArcadeAudioContext(allowCreate);
  if (!audio || audio.state !== "running") {
    if (allowCreate && audio?.state === "suspended") {
      void resumeArcadeAudio().then(() => playArcadeSound(sound, false));
    }
    return;
  }

  if (sound === "navigate") {
    const start = audio.currentTime;
    const duration = 0.026;
    const buffer = audio.createBuffer(
      1,
      Math.ceil(audio.sampleRate * duration),
      audio.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      const decay = Math.pow(1 - index / samples.length, 6);
      samples[index] = (Math.random() * 2 - 1) * decay;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const snapGain = audio.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    filter.Q.value = 0.65;
    snapGain.gain.setValueAtTime(0.055, start);
    snapGain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(snapGain);
    snapGain.connect(audio.destination);

    const body = audio.createOscillator();
    const bodyGain = audio.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(180, start);
    body.frequency.exponentialRampToValueAtTime(105, start + 0.038);
    bodyGain.gain.setValueAtTime(0.06, start);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, start + 0.042);
    body.connect(bodyGain);
    bodyGain.connect(audio.destination);

    source.start(start);
    body.start(start);
    body.stop(start + 0.045);
    return;
  }

  const notes: Record<ArcadeSound, Array<[number, number, number]>> = {
    arrival: [[110, 0, 0.055], [165, 0.045, 0.055]],
    shoot: [[620, 0, 0.055], [310, 0.035, 0.06]],
    blaster: [[980, 0, 0.045], [720, 0.025, 0.055], [420, 0.055, 0.07]],
    hit: [[180, 0, 0.07], [90, 0.045, 0.09]],
    bounce: [[260, 0, 0.045]],
    power: [[180, 0, 0.06], [420, 0.045, 0.08], [920, 0.1, 0.14]],
    deny: [[190, 0, 0.08], [130, 0.09, 0.14]],
    "timing-early": [[300, 0, 0.07], [260, 0.075, 0.09]],
    "timing-late": [[210, 0, 0.08], [150, 0.08, 0.12]],
    score: [[440, 0, 0.08], [660, 0.075, 0.08], [880, 0.15, 0.12]],
    "wave-clear": [
      [330, 0, 0.09],
      [440, 0.08, 0.09],
      [550, 0.16, 0.09],
      [880, 0.24, 0.16],
    ],
    "game-over": [[220, 0, 0.12], [165, 0.12, 0.12], [110, 0.24, 0.2]],
    select: [[330, 0, 0.045], [520, 0.045, 0.06]],
    "countdown-3": [[330, 0, 0.11]],
    "countdown-2": [[440, 0, 0.11]],
    "countdown-1": [[554, 0, 0.11]],
    "countdown-go": [[880, 0, 0.08], [1175, 0.07, 0.22]],
    navigate: [],
  };
  const start = audio.currentTime;
  const volume = sound === "countdown-go" ? 0.07 : 0.035;
  const wave: OscillatorType = "square";
  notes[sound].forEach(([frequency, delay, duration]) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start + delay);
    gain.gain.setValueAtTime(volume, start + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, start + delay + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start + delay);
    oscillator.stop(start + delay + duration);
  });
}
