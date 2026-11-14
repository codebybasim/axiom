// Synthesized retro arcade audio using the browser Web Audio API.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.06,
  delay = 0,
  endFreq?: number
) {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  }

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

export const arcadeSound = {
  click(muted: boolean) {
    if (muted) return;
    tone(520, 0.045, 'triangle', 0.05);
  },
  jump(muted: boolean) {
    if (muted) return;
    tone(320, 0.11, 'square', 0.045, 0, 680);
  },
  flap(muted: boolean) {
    if (muted) return;
    tone(380, 0.07, 'sine', 0.06, 0, 560);
  },
  merge(muted: boolean, pitch = 1) {
    if (muted) return;
    tone(320 + Math.min(600, pitch * 45), 0.08, 'triangle', 0.06, 0, 460 + pitch * 40);
  },
  chomp(muted: boolean, high = false) {
    if (muted) return;
    tone(high ? 580 : 440, 0.055, 'triangle', 0.045, 0, high ? 320 : 260);
  },
  simon(muted: boolean, quadrant: number) {
    if (muted) return;
    const freqs = [329.63, 261.63, 220.0, 440.0]; // E4, C4, A3, A4
    tone(freqs[quadrant % 4], 0.24, 'sine', 0.09);
  },
  eat(muted: boolean) {
    if (muted) return;
    tone(587, 0.07, 'square', 0.05, 0);
    tone(880, 0.09, 'square', 0.05, 0.06);
  },
  bonus(muted: boolean) {
    if (muted) return;
    tone(523, 0.07, 'square', 0.05, 0);
    tone(659, 0.07, 'square', 0.05, 0.06);
    tone(784, 0.07, 'square', 0.05, 0.12);
    tone(1046, 0.14, 'square', 0.05, 0.18);
  },
  bounce(muted: boolean, high = false) {
    if (muted) return;
    tone(high ? 660 : 420, 0.05, 'square', 0.045);
  },
  brick(muted: boolean, pitchOffset = 0) {
    if (muted) return;
    tone(360 + pitchOffset * 35, 0.07, 'triangle', 0.06, 0, 220);
  },
  clear(muted: boolean, lines = 1) {
    if (muted) return;
    const base = 440;
    for (let i = 0; i < Math.min(4, lines); i++) {
      tone(base * (1 + i * 0.25), 0.09, 'square', 0.05, i * 0.065);
    }
  },
  laser(muted: boolean) {
    if (muted) return;
    tone(880, 0.09, 'sawtooth', 0.04, 0, 220);
  },
  explosion(muted: boolean) {
    if (muted) return;
    tone(160, 0.18, 'sawtooth', 0.06, 0, 42);
  },
  flag(muted: boolean) {
    if (muted) return;
    tone(480, 0.05, 'sine', 0.05);
  },
  gameOver(muted: boolean) {
    if (muted) return;
    tone(330, 0.12, 'sawtooth', 0.06, 0);
    tone(262, 0.12, 'sawtooth', 0.06, 0.12);
    tone(196, 0.26, 'sawtooth', 0.06, 0.24);
  },
  victory(muted: boolean) {
    if (muted) return;
    tone(523, 0.1, 'triangle', 0.06, 0);
    tone(659, 0.1, 'triangle', 0.06, 0.1);
    tone(784, 0.1, 'triangle', 0.06, 0.2);
    tone(1046, 0.24, 'triangle', 0.07, 0.3);
  },
};
