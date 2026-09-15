/**
 * Decipher — rapid data ticks resolving into a clear tone.
 */

const DURATION = 2.8;

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

export function synthesizeDecipherSound(audio: AudioContext): () => void {
  const start = audio.currentTime;
  const stops: Array<() => void> = [];

  const master = audio.createGain();
  master.gain.setValueAtTime(0.001, start);
  master.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
  master.gain.setValueAtTime(0.1, start + 1.6);
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

  // Low scanning hum underneath.
  const hum = audio.createOscillator();
  const humGain = audio.createGain();
  hum.type = "sawtooth";
  hum.frequency.setValueAtTime(55, start);
  hum.frequency.exponentialRampToValueAtTime(72, start + 1.4);
  hum.frequency.exponentialRampToValueAtTime(48, start + DURATION);
  const humFilter = audio.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 180;
  hum.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(master);
  applyEnvelope(audio, start, humGain, {
    delay: 0,
    attack: 0.18,
    hold: 1.2,
    release: 1.2,
    peak: 0.04,
  });
  hum.start(start);
  hum.stop(start + DURATION);
  stop(hum);

  // Rapid decode ticks — staggered blips that speed up then resolve.
  const tickCount = 18;
  for (let i = 0; i < tickCount; i += 1) {
    const progress = i / (tickCount - 1);
    const delay = 0.06 + progress ** 1.6 * 1.35;
    const hz = 420 + progress * 680 + (i % 3) * 40;
    const peak = 0.06 + progress * 0.04;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(hz, start + delay);
    osc.connect(gain);
    gain.connect(master);
    const end = applyEnvelope(audio, start, gain, {
      delay,
      attack: 0.003,
      hold: 0.012,
      release: 0.028,
      peak,
    });
    osc.start(start + delay);
    osc.stop(end + 0.02);
    stop(osc);
  }

  // Glitch bursts — short noise slices between ticks.
  const burstTimes = [0.22, 0.48, 0.78, 1.05, 1.32];
  burstTimes.forEach((delay, index) => {
    const burstLen = Math.ceil(audio.sampleRate * 0.04);
    const burstBuf = audio.createBuffer(1, burstLen, audio.sampleRate);
    const burstData = burstBuf.getChannelData(0);
    for (let i = 0; i < burstLen; i += 1) {
      burstData[i] = (Math.random() * 2 - 1) * (1 - i / burstLen);
    }
    const burst = audio.createBufferSource();
    burst.buffer = burstBuf;
    const burstFilter = audio.createBiquadFilter();
    burstFilter.type = "bandpass";
    burstFilter.frequency.value = 1200 + index * 280;
    burstFilter.Q.value = 1.2;
    const burstGain = audio.createGain();
    burst.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(master);
    applyEnvelope(audio, start, burstGain, {
      delay,
      attack: 0.002,
      hold: 0.01,
      release: 0.025,
      peak: 0.035,
    });
    burst.start(start + delay);
    burst.stop(start + delay + 0.05);
    stop(burst);
  });

  // Resolution chord — characters settle into place.
  const resolveDelay = 1.55;
  const resolveNotes = [330, 440, 554];
  resolveNotes.forEach((hz, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, start + resolveDelay + index * 0.04);
    osc.connect(gain);
    gain.connect(master);
    const end = applyEnvelope(audio, start, gain, {
      delay: resolveDelay + index * 0.04,
      attack: 0.04,
      hold: 0.2,
      release: 0.9,
      peak: 0.08 / resolveNotes.length,
    });
    osc.start(start + resolveDelay + index * 0.04);
    osc.stop(end + 0.05);
    stop(osc);
  });

  // Final lock-in click.
  const lockOsc = audio.createOscillator();
  const lockGain = audio.createGain();
  lockOsc.type = "triangle";
  lockOsc.frequency.setValueAtTime(660, start + 1.72);
  lockOsc.frequency.exponentialRampToValueAtTime(880, start + 1.78);
  lockOsc.connect(lockGain);
  lockGain.connect(master);
  const lockEnd = applyEnvelope(audio, start, lockGain, {
    delay: 1.72,
    attack: 0.006,
    hold: 0.04,
    release: 0.25,
    peak: 0.1,
  });
  lockOsc.start(start + 1.72);
  lockOsc.stop(lockEnd + 0.05);
  stop(lockOsc);

  return () => stops.forEach((fn) => fn());
}
