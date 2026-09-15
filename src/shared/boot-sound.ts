/**
 * PS2 boot cover — ~4.5s, single swell then smooth fade.
 */

const DURATION = 4.5;

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

function scheduleMasterEnvelope(master: GainNode, start: number) {
  const g = 0.11;
  const points: Array<[number, number]> = [
    [0, 0.002],
    [0.14, 0.07],
    [0.22, 0.78],
    [0.32, 1.0],
    [0.55, 0.68],
    [0.9, 0.32],
    [1.4, 0.12],
    [2.2, 0.045],
    [DURATION, 0.001],
  ];

  master.gain.setValueAtTime(0.001, start);
  for (let index = 1; index < points.length; index += 1) {
    const [time, level] = points[index];
    master.gain.exponentialRampToValueAtTime(
      Math.max(level * g, 0.001),
      start + time,
    );
  }
}

export function synthesizeBootSound(audio: AudioContext): () => void {
  const start = audio.currentTime;
  const stops: Array<() => void> = [];

  const dry = audio.createGain();
  dry.gain.value = 0.06;

  const wet = audio.createGain();
  wet.gain.value = 1;

  const master = audio.createGain();
  scheduleMasterEnvelope(master, start);

  dry.connect(master);
  wet.connect(master);

  const tone = audio.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(5800, start);
  tone.frequency.setValueAtTime(6400, start + 0.35);
  tone.frequency.exponentialRampToValueAtTime(800, start + DURATION);
  tone.Q.value = 0.35;
  master.connect(tone);
  tone.connect(audio.destination);

  const delayA = audio.createDelay(0.6);
  delayA.delayTime.value = 0.16;
  const delayB = audio.createDelay(0.6);
  delayB.delayTime.value = 0.28;
  const feedback = audio.createGain();
  feedback.gain.value = 0.28;
  const spaceFilter = audio.createBiquadFilter();
  spaceFilter.type = "lowpass";
  spaceFilter.frequency.value = 2200;

  wet.connect(delayA);
  delayA.connect(spaceFilter);
  spaceFilter.connect(delayB);
  delayB.connect(feedback);
  feedback.connect(delayA);
  delayB.connect(audio.destination);
  delayA.connect(audio.destination);

  const stop = (node: { stop: () => void }) => {
    stops.push(() => {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    });
  };

  const addSine = (
    hz: number,
    env: Envelope,
    dest: AudioNode,
    detuneCents = 0,
    pitchBend?: Array<{ at: number; hz: number }>,
  ) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";

    if (pitchBend?.length) {
      pitchBend.forEach(({ at, hz: bendHz }, index) => {
        const time = start + env.delay + at;
        if (index === 0) osc.frequency.setValueAtTime(bendHz, time);
        else osc.frequency.exponentialRampToValueAtTime(bendHz, time);
      });
    } else {
      osc.frequency.setValueAtTime(
        hz * 2 ** (detuneCents / 1200),
        start + env.delay,
      );
    }

    osc.connect(gain);
    gain.connect(dest);
    const end = applyEnvelope(audio, start, gain, env);
    osc.start(start + env.delay);
    osc.stop(end + 0.05);
    stop(osc);
  };

  const addCluster = (
    center: number,
    env: Envelope,
    dest: AudioNode,
    peak: number,
    detunes = [-4, 0, 4],
  ) => {
    detunes.forEach((cents) => {
      addSine(center, { ...env, peak: peak / detunes.length }, dest, cents);
    });
  };

  // Quiet pre-hit breath.
  const breath: Envelope = {
    delay: 0.03,
    attack: 0.22,
    hold: 0.08,
    release: 0.35,
    peak: 1,
  };
  addCluster(73.4, breath, wet, 0.006, [-3, 3]);

  // Whoosh into the hit — ends before the chord peaks.
  const whooshLen = Math.ceil(audio.sampleRate * 0.62);
  const whooshBuf = audio.createBuffer(1, whooshLen, audio.sampleRate);
  const whooshData = whooshBuf.getChannelData(0);
  for (let i = 0; i < whooshLen; i += 1) {
    const t = i / whooshLen;
    const amp = Math.sin(Math.min(t * 2.5, 1) * Math.PI * 0.5) * (1 - t) ** 1.5;
    whooshData[i] = (Math.random() * 2 - 1) * amp;
  }
  const whoosh = audio.createBufferSource();
  whoosh.buffer = whooshBuf;
  const whooshFilter = audio.createBiquadFilter();
  whooshFilter.type = "bandpass";
  whooshFilter.Q.value = 0.68;
  whooshFilter.frequency.setValueAtTime(210, start + 0.12);
  whooshFilter.frequency.exponentialRampToValueAtTime(700, start + 0.3);
  const whooshGain = audio.createGain();
  whoosh.connect(whooshFilter);
  whooshFilter.connect(whooshGain);
  whooshGain.connect(wet);
  applyEnvelope(audio, start, whooshGain, {
    delay: 0.12,
    attack: 0.12,
    hold: 0.06,
    release: 0.28,
    peak: 0.042,
  });
  whoosh.start(start + 0.12);
  whoosh.stop(start + 0.62);
  stop(whoosh);

  // Soft shimmer flash on the hit.
  const shimmerLen = Math.ceil(audio.sampleRate * 0.38);
  const shimmerBuf = audio.createBuffer(1, shimmerLen, audio.sampleRate);
  const shimmerData = shimmerBuf.getChannelData(0);
  for (let i = 0; i < shimmerLen; i += 1) {
    shimmerData[i] = (Math.random() * 2 - 1) * (1 - i / shimmerLen) ** 2.4;
  }
  const shimmer = audio.createBufferSource();
  shimmer.buffer = shimmerBuf;
  const shimmerFilter = audio.createBiquadFilter();
  shimmerFilter.type = "highpass";
  shimmerFilter.frequency.value = 3200;
  const shimmerGain = audio.createGain();
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(wet);
  applyEnvelope(audio, start, shimmerGain, {
    delay: 0.24,
    attack: 0.015,
    hold: 0.03,
    release: 0.22,
    peak: 0.018,
  });
  shimmer.start(start + 0.24);
  shimmer.stop(start + 0.55);
  stop(shimmer);

  // Main chord hit.
  const hit: Envelope = {
    delay: 0.24,
    attack: 0.12,
    hold: 0.18,
    release: 3.4,
    peak: 1,
  };
  const hitLevels: Array<[number, number]> = [
    [453, 0.03],
    [533, 0.036],
    [605, 0.044],
    [710, 0.05],
    [805, 0.026],
    [1235, 0.012],
  ];
  hitLevels.forEach(([hz, level]) => addCluster(hz, hit, wet, level));

  // Deep note — slow merge under the chord, no pitch dip back down.
  const sub: Envelope = {
    delay: 0.58,
    attack: 0.72,
    hold: 0.35,
    release: 2.8,
    peak: 1,
  };
  addSine(
    43.65,
    { ...sub, peak: 0.048 },
    wet,
    0,
    [
      { at: 0, hz: 43.65 },
      { at: 0.55, hz: 45.5 },
    ],
  );
  addSine(87.31, { ...sub, peak: 0.012 }, wet);
  addSine(43.65, { ...sub, peak: 0.008 }, dry);

  // Air bed — smooth fade, no mid-song bumps.
  const airLen = Math.ceil(audio.sampleRate * DURATION);
  const airBuf = audio.createBuffer(1, airLen, audio.sampleRate);
  const airData = airBuf.getChannelData(0);
  for (let i = 0; i < airLen; i += 1) {
    const t = i / airLen;
    const level = (t < 0.12 ? t / 0.12 : 1) * (1 - t) ** 0.85 * 0.28;
    airData[i] = (Math.random() * 2 - 1) * level;
  }
  const air = audio.createBufferSource();
  air.buffer = airBuf;
  const airFilter = audio.createBiquadFilter();
  airFilter.type = "lowpass";
  airFilter.frequency.value = 420;
  const airGain = audio.createGain();
  airGain.gain.value = 0.006;
  air.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(wet);
  air.start(start);
  air.stop(start + DURATION);
  stop(air);

  return () => stops.forEach((fn) => fn());
};
