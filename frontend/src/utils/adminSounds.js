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

// Short burst of filtered noise — the "ka" of a cash register drawer
const noiseBurst = (c, start, duration, volume) => {
  const length = Math.ceil(c.sampleRate * duration);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(start);
};

// Metallic bell — inharmonic partials give the bright "ching"
const bell = (c, freq, start, duration, volume) => {
  [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.25, 0.35], [8.93, 0.12, 0.2]].forEach(([ratio, level, decay]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume * level, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration * decay);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
};

// Soft rounded "bloop": a triangle wave gliding upward with a quick fade
const bloop = (c, from, to, start, duration, volume) => {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration * 0.6);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
};

const play = (schedule) => {
  const c = getCtx();
  if (!c || c.state !== 'running') return false;
  schedule(c, c.currentTime + 0.02);
  return true;
};

// New order: loud cash-register "ka-ching!" twice
export const playNewOrderSound = () =>
  play((c, t) => {
    [0, 0.9].forEach((offset) => {
      noiseBurst(c, t + offset, 0.08, 0.35);
      bell(c, 2637, t + offset + 0.07, 1.2, 0.4);
      bell(c, 3520, t + offset + 0.12, 1.0, 0.25);
    });
  });

// Add to cart: one quiet, low "bloop"
export const playCartAddSound = () =>
  play((c, t) => bloop(c, 330, 520, t, 0.22, 0.2));
