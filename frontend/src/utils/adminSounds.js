// Admin alert sounds, synthesized with the Web Audio API (no audio files to ship).
// Browsers keep audio locked until the page gets a user gesture, so call
// unlockAdminAudio() from a click handler (the admin bell does this).

let ctx = null;

const getCtx = () => {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
};

export const unlockAdminAudio = () => {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
};

export const isAdminAudioLocked = () => !ctx || ctx.state !== 'running';

// One soft bell-like note: sine + quiet octave overtone with a fast attack and long decay
const tone = (c, freq, start, duration, volume) => {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(c.destination);

  [[freq, 1], [freq * 2, 0.25]].forEach(([f, level]) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, start);
    g.gain.value = level;
    osc.connect(g).connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
};

const play = (notes) => {
  const c = getCtx();
  if (!c || c.state !== 'running') return false;
  const now = c.currentTime + 0.02;
  notes.forEach(([freq, offset, duration, volume]) => tone(c, freq, now + offset, duration, volume));
  return true;
};

// New order: bright rising arpeggio played twice (C6 E6 G6 C7)
export const playNewOrderSound = () =>
  play([
    [1046.5, 0.0, 0.5, 0.35], [1318.5, 0.1, 0.5, 0.35], [1568.0, 0.2, 0.5, 0.35], [2093.0, 0.3, 0.9, 0.3],
    [1046.5, 0.9, 0.5, 0.35], [1318.5, 1.0, 0.5, 0.35], [1568.0, 1.1, 0.5, 0.35], [2093.0, 1.2, 1.2, 0.3],
  ]);

// Add to cart: short, softer two-note "pop" (G5 → D6)
export const playCartAddSound = () =>
  play([
    [784.0, 0.0, 0.35, 0.25],
    [1174.7, 0.12, 0.6, 0.25],
  ]);
