/**
 * Mail swoosh — envelope flying in, soft arrival chime.
 */

const DURATION = 3.4;

type Envelope = {
  delay: number;
  attack: number;
  hold: number;
  release: number;
  peak: number;
};

function applyEnvelope(
  audio: AudioContext,
  start: number,
  gain: GainNode,
  env: Envelope,
) {
  const t0 = start + env.delay;
  const t1 = t0 + env.attack;
  const t2 = t1 + env.hold;
  const t3 = Math.min(t2 + env.release, start + DURATION);

  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(env.peak, 0.001), t1);
  gain.gain.setValueAtTime(env.peak, t2);
  gain.gain.exponentialRampToValueAtTime(0.001, t3);
  return t3;
}

export function synthesizeMailSwooshSound(audio: AudioContext): () => void {
  const start = audio.currentTime;
  const stops: Array<() => void> = [];

  const master = audio.createGain();
  master.gain.setValueAtTime(0.001, start);
  master.gain.exponentialRampToValueAtTime(0.09, start + 0.08);
  master.gain.setValueAtTime(0.09, start + 2.2);
  master.gain.exponentialRampToValueAtTime(0.001, start + DURATION);
  master.connect(audio.destination);

  const stop = (node: { stop: () => void }) => {
    stops.push(() => {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    });
  };

  const addTone = (hz: number, env: Envelope, type: OscillatorType = "sine") => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, start + env.delay);
    osc.connect(gain);
    gain.connect(master);
    const end = applyEnvelope(audio, start, gain, env);
    osc.start(start + env.delay);
    osc.stop(end + 0.05);
    stop(osc);
  };

  // Distant approach — low airy whoosh building from far away.
  const approachLen = Math.ceil(audio.sampleRate * 1.4);
  const approachBuf = audio.createBuffer(1, approachLen, audio.sampleRate);
  const approachData = approachBuf.getChannelData(0);
  for (let i = 0; i < approachLen; i += 1) {
    const t = i / approachLen;
    const amp = t ** 1.4 * (1 - t * 0.15);
    approachData[i] = (Math.random() * 2 - 1) * amp;
  }
  const approach = audio.createBufferSource();
  approach.buffer = approachBuf;
  const approachFilter = audio.createBiquadFilter();
  approachFilter.type = "bandpass";
  approachFilter.Q.value = 0.55;
  approachFilter.frequency.setValueAtTime(120, start + 0.06);
  approachFilter.frequency.exponentialRampToValueAtTime(520, start + 0.9);
  approachFilter.frequency.exponentialRampToValueAtTime(1100, start + 1.4);
  const approachGain = audio.createGain();
  approach.connect(approachFilter);
  approachFilter.connect(approachGain);
  approachGain.connect(master);
  applyEnvelope(audio, start, approachGain, {
    delay: 0.06,
    attack: 0.35,
    hold: 0.45,
    release: 0.5,
    peak: 0.22,
  });
  approach.start(start + 0.06);
  approach.stop(start + 1.46);
  stop(approach);

  // Main swoosh — longer glide as the envelope closes in.
  const swooshLen = Math.ceil(audio.sampleRate * 1.35);
  const swooshBuf = audio.createBuffer(1, swooshLen, audio.sampleRate);
  const swooshData = swooshBuf.getChannelData(0);
  for (let i = 0; i < swooshLen; i += 1) {
    const t = i / swooshLen;
    const amp = Math.sin(t * Math.PI) * (0.35 + t * 0.65);
    swooshData[i] = (Math.random() * 2 - 1) * amp;
  }
  const swoosh = audio.createBufferSource();
  swoosh.buffer = swooshBuf;
  const swooshFilter = audio.createBiquadFilter();
  swooshFilter.type = "bandpass";
  swooshFilter.Q.value = 0.9;
  swooshFilter.frequency.setValueAtTime(380, start + 0.55);
  swooshFilter.frequency.exponentialRampToValueAtTime(2600, start + 1.35);
  swooshFilter.frequency.exponentialRampToValueAtTime(1200, start + 1.9);
  const swooshGain = audio.createGain();
  swoosh.connect(swooshFilter);
  swooshFilter.connect(swooshGain);
  swooshGain.connect(master);
  applyEnvelope(audio, start, swooshGain, {
    delay: 0.55,
    attack: 0.18,
    hold: 0.28,
    release: 0.72,
    peak: 0.5,
  });
  swoosh.start(start + 0.55);
  swoosh.stop(start + 1.95);
  stop(swoosh);

  // Paper flutter as it nears the inbox.
  const flutterLen = Math.ceil(audio.sampleRate * 0.55);
  const flutterBuf = audio.createBuffer(1, flutterLen, audio.sampleRate);
  const flutterData = flutterBuf.getChannelData(0);
  for (let i = 0; i < flutterLen; i += 1) {
    const t = i / flutterLen;
    flutterData[i] = (Math.random() * 2 - 1) * (1 - t) ** 1.4 * 0.45;
  }
  const flutter = audio.createBufferSource();
  flutter.buffer = flutterBuf;
  const flutterFilter = audio.createBiquadFilter();
  flutterFilter.type = "highpass";
  flutterFilter.frequency.value = 1600;
  const flutterGain = audio.createGain();
  flutter.connect(flutterFilter);
  flutterFilter.connect(flutterGain);
  flutterGain.connect(master);
  applyEnvelope(audio, start, flutterGain, {
    delay: 1.42,
    attack: 0.04,
    hold: 0.08,
    release: 0.38,
    peak: 0.14,
  });
  flutter.start(start + 1.42);
  flutter.stop(start + 2.0);
  stop(flutter);

  // Arrival chime — layered tones with a longer tail.
  addTone(660, {
    delay: 1.82,
    attack: 0.01,
    hold: 0.12,
    release: 1.1,
    peak: 0.1,
  });
  addTone(880, {
    delay: 1.9,
    attack: 0.008,
    hold: 0.14,
    release: 1.2,
    peak: 0.14,
  });
  addTone(1320, {
    delay: 1.98,
    attack: 0.006,
    hold: 0.1,
    release: 1.15,
    peak: 0.07,
  });

  // Soft resonance bed after landing.
  addTone(440, {
    delay: 2.05,
    attack: 0.2,
    hold: 0.35,
    release: 0.9,
    peak: 0.03,
  });

  return () => stops.forEach((fn) => fn());
}
