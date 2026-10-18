// ============================================================================
// KIDROO TOYS - Web Audio Procedural Animal Sound Synthesizer
// 100% Offline, Zero Network Latency, Authentic & Playful Cartoon Animal Audio
// ============================================================================

let audioCtx = null;
let isMuted = false;
let masterVolume = 0.85;

// Initialize or resume AudioContext safely
export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const setMuted = (muted) => {
  isMuted = muted;
  try {
    localStorage.setItem('kidroo_sound_muted', muted ? '1' : '0');
  } catch {
    // ignore
  }
};

export const getMuted = () => {
  try {
    return localStorage.getItem('kidroo_sound_muted') === '1';
  } catch {
    return isMuted;
  }
};

export const setVolume = (vol) => {
  masterVolume = Math.max(0, Math.min(1, vol));
};

export const getVolume = () => masterVolume;

// Helper to create a noise buffer
const createNoiseBuffer = (ctx, duration = 1.0) => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    // Pinkish noise
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
};

// ─── Sound Generators for each Animal ────────────────────────────────────────

// 🦁 Lion Roar
const playLion = (ctx, now, vol) => {
  // Low resonant body rumble
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc2.type = 'triangle';

  // Pitch sweep from 130Hz down to 60Hz
  osc1.frequency.setValueAtTime(120, now);
  osc1.frequency.exponentialRampToValueAtTime(160, now + 0.25);
  osc1.frequency.exponentialRampToValueAtTime(65, now + 1.2);

  osc2.frequency.setValueAtTime(60, now);
  osc2.frequency.exponentialRampToValueAtTime(45, now + 1.2);

  // Bandpass filter to create resonant roar chest
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(280, now);
  filter.frequency.linearRampToValueAtTime(420, now + 0.3);
  filter.frequency.linearRampToValueAtTime(160, now + 1.2);
  filter.Q.value = 3.5;

  // Modulate amplitude for growl/vibrato
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(24, now);
  lfoGain.gain.setValueAtTime(0.35, now);
  lfo.connect(lfoGain.gain);

  // Noise layer for breath/growl roar
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 1.2);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(320, now);
  noiseFilter.frequency.linearRampToValueAtTime(600, now + 0.3);
  noiseFilter.frequency.linearRampToValueAtTime(200, now + 1.2);
  noiseFilter.Q.value = 2.0;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.linearRampToValueAtTime(0.35 * vol, now + 0.15);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.55 * vol, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);
  noise.start(now);

  osc1.stop(now + 1.35);
  osc2.stop(now + 1.35);
  lfo.stop(now + 1.35);
  noise.stop(now + 1.35);
};

// 🐘 Elephant Trumpet
const playElephant = (ctx, now, vol) => {
  const osc = ctx.createOscillator();
  const oscHarmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  oscHarmonic.type = 'sawtooth';

  // Brassy trumpet glide: rise up high and flare
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.45);
  osc.frequency.exponentialRampToValueAtTime(420, now + 1.05);

  oscHarmonic.frequency.setValueAtTime(640, now);
  oscHarmonic.frequency.exponentialRampToValueAtTime(1280, now + 0.2);
  oscHarmonic.frequency.exponentialRampToValueAtTime(840, now + 1.05);

  // Fast FM vibrato for the buzzing trumpet lip
  const buzz = ctx.createOscillator();
  const buzzGain = ctx.createGain();
  buzz.frequency.setValueAtTime(16, now);
  buzzGain.gain.setValueAtTime(25, now);
  buzz.connect(osc.frequency);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.linearRampToValueAtTime(1400, now + 0.25);
  filter.frequency.linearRampToValueAtTime(700, now + 1.05);
  filter.Q.value = 4.2;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.48 * vol, now + 0.12);
  gain.gain.setValueAtTime(0.45 * vol, now + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

  osc.connect(filter);
  oscHarmonic.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  buzz.start(now);
  osc.start(now);
  oscHarmonic.start(now);

  buzz.stop(now + 1.15);
  osc.stop(now + 1.15);
  oscHarmonic.stop(now + 1.15);
};

// 🐵 Monkey Chatter ("Ooh-ooh-aah-aah!")
const playMonkey = (ctx, now, vol) => {
  const bursts = [
    { start: 0.0,  f1: 650, f2: 950, dur: 0.12 },
    { start: 0.15, f1: 720, f2: 1100, dur: 0.13 },
    { start: 0.32, f1: 850, f2: 1350, dur: 0.16 },
    { start: 0.52, f1: 950, f2: 1450, dur: 0.22 },
  ];

  bursts.forEach(b => {
    const t = now + b.start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(b.f1, t);
    osc.frequency.exponentialRampToValueAtTime(b.f2, t + b.dur * 0.6);
    osc.frequency.exponentialRampToValueAtTime(b.f1 * 0.9, t + b.dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(b.f2, t);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.4 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + b.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + b.dur + 0.02);
  });
};

// 🐶 Puppy Bark ("Woof! Woof!")
const playDog = (ctx, now, vol) => {
  const barks = [0.0, 0.22];

  barks.forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    subOsc.type = 'triangle';

    // Sharp downward pitch attack
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(170, t + 0.14);

    subOsc.frequency.setValueAtTime(225, t);
    subOsc.frequency.exponentialRampToValueAtTime(95, t + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(350, t + 0.14);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.55 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + 0.18);
    subOsc.stop(t + 0.18);
  });
};

// 🐱 Kitten Meow ("Meooowww~")
const playCat = (ctx, now, vol) => {
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  overtone.type = 'triangle';

  // Classic cat pitch glide: "Mee-oooww"
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(760, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.55);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.95);

  overtone.frequency.setValueAtTime(960, now);
  overtone.frequency.exponentialRampToValueAtTime(1520, now + 0.25);
  overtone.frequency.exponentialRampToValueAtTime(840, now + 0.95);

  // Soft purr tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(6.5, now);
  lfoGain.gain.setValueAtTime(0.2, now);
  lfo.connect(lfoGain.gain);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(1200, now + 0.3);
  filter.frequency.linearRampToValueAtTime(600, now + 0.95);
  filter.Q.value = 2.2;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.42 * vol, now + 0.15);
  gain.gain.linearRampToValueAtTime(0.35 * vol, now + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  osc.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  overtone.start(now);
  lfo.start(now);

  osc.stop(now + 1.05);
  overtone.stop(now + 1.05);
  lfo.stop(now + 1.05);
};

// 🐸 Frog Ribbit ("Ribbit! Croak!")
const playFrog = (ctx, now, vol) => {
  const croaks = [
    { start: 0.0, f: 190, dur: 0.14 },
    { start: 0.2, f: 310, dur: 0.28 },
  ];

  croaks.forEach(c => {
    const t = now + c.start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(c.f, t);
    osc.frequency.linearRampToValueAtTime(c.f * 1.25, t + c.dur * 0.4);
    osc.frequency.linearRampToValueAtTime(c.f * 0.85, t + c.dur);

    // Fast throat sac flutter
    const flutter = ctx.createOscillator();
    const flutterGain = ctx.createGain();
    flutter.frequency.setValueAtTime(28, t);
    flutterGain.gain.setValueAtTime(0.6, t);
    flutter.connect(flutterGain.gain);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(c.f * 1.8, t);
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.48 * vol, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    flutter.start(t);
    osc.start(t);
    flutter.stop(t + c.dur + 0.02);
    osc.stop(t + c.dur + 0.02);
  });
};

// 🦆 Duck Quack ("Quack! Quack! Quack!")
const playDuck = (ctx, now, vol) => {
  const quacks = [0.0, 0.16, 0.34];

  quacks.forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const f1 = ctx.createBiquadFilter();
    const f2 = ctx.createBiquadFilter();

    // Nasal square wave
    osc.type = 'square';
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);

    // Formant 1: around 680Hz
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(680, t);
    f1.Q.value = 4.0;

    // Formant 2: around 1450Hz
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1450, t);
    f2.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.42 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  });
};

// 🐮 Cow Moo ("Mooooooo!")
const playCow = (ctx, now, vol) => {
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  sub.type = 'triangle';

  osc.frequency.setValueAtTime(140, now);
  osc.frequency.linearRampToValueAtTime(155, now + 0.4);
  osc.frequency.linearRampToValueAtTime(115, now + 1.25);

  sub.frequency.setValueAtTime(70, now);
  sub.frequency.linearRampToValueAtTime(58, now + 1.25);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(380, now);
  filter.frequency.linearRampToValueAtTime(450, now + 0.4);
  filter.frequency.linearRampToValueAtTime(280, now + 1.25);
  filter.Q.value = 3.0;

  // Gentle vibrato
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(3.8, now);
  lfoGain.gain.setValueAtTime(3.5, now);
  lfo.connect(osc.frequency);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.48 * vol, now + 0.2);
  gain.gain.setValueAtTime(0.42 * vol, now + 0.85);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  lfo.start(now);
  osc.start(now);
  sub.start(now);

  lfo.stop(now + 1.35);
  osc.stop(now + 1.35);
  sub.stop(now + 1.35);
};

// 🦊 Fox Yip ("Yip! Yap!")
const playFox = (ctx, now, vol) => {
  const yips = [0.0, 0.18];

  yips.forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(940, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.14);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.42 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  });
};

// 🐼 Panda Squeak & Munch
const playPanda = (ctx, now, vol) => {
  const chirps = [
    { start: 0.0,  f: 750, dur: 0.12 },
    { start: 0.14, f: 980, dur: 0.16 },
  ];

  chirps.forEach(c => {
    const t = now + c.start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(c.f, t);
    osc.frequency.exponentialRampToValueAtTime(c.f * 1.3, t + c.dur * 0.4);
    osc.frequency.exponentialRampToValueAtTime(c.f * 0.9, t + c.dur);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.38 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + c.dur + 0.02);
  });
};

// 🦄 Unicorn Magic Chime & Sparkle
const playUnicorn = (ctx, now, vol) => {
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6

  notes.forEach((freq, idx) => {
    const t = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35 * vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.65);
  });

  // Whimsical neigh sweep at the end
  const neighTime = now + 0.45;
  const neighOsc = ctx.createOscillator();
  const neighGain = ctx.createGain();
  const neighFilter = ctx.createBiquadFilter();

  neighOsc.type = 'sawtooth';
  neighOsc.frequency.setValueAtTime(450, neighTime);
  neighOsc.frequency.exponentialRampToValueAtTime(750, neighTime + 0.15);
  neighOsc.frequency.exponentialRampToValueAtTime(380, neighTime + 0.55);

  neighFilter.type = 'bandpass';
  neighFilter.frequency.setValueAtTime(800, neighTime);
  neighFilter.Q.value = 3.0;

  neighGain.gain.setValueAtTime(0.001, neighTime);
  neighGain.gain.linearRampToValueAtTime(0.28 * vol, neighTime + 0.1);
  neighGain.gain.exponentialRampToValueAtTime(0.001, neighTime + 0.6);

  neighOsc.connect(neighFilter);
  neighFilter.connect(neighGain);
  neighGain.connect(ctx.destination);

  neighOsc.start(neighTime);
  neighOsc.stop(neighTime + 0.65);
};

// 🦉 Owl Hoot ("Hoo... Hoo-hoooo!")
const playOwl = (ctx, now, vol) => {
  const hoots = [
    { start: 0.0,  dur: 0.28, f: 380 },
    { start: 0.42, dur: 0.55, f: 410 },
  ];

  hoots.forEach(h => {
    const t = now + h.start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(h.f, t);
    osc.frequency.linearRampToValueAtTime(h.f * 1.05, t + h.dur * 0.3);
    osc.frequency.linearRampToValueAtTime(h.f * 0.92, t + h.dur);

    // Warm hollow resonance
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    // Soft tremolo
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(4.5, t);
    lfoGain.gain.setValueAtTime(5, t);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.45 * vol, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + h.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + h.dur + 0.02);
    osc.stop(t + h.dur + 0.02);
  });
};

// 🐻 Bear Growl ("Grrr-hello!")
const playBear = (ctx, now, vol) => {
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  sub.type = 'triangle';

  osc.frequency.setValueAtTime(110, now);
  osc.frequency.linearRampToValueAtTime(140, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(65, now + 0.95);

  sub.frequency.setValueAtTime(55, now);
  sub.frequency.exponentialRampToValueAtTime(40, now + 0.95);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(260, now);
  filter.Q.value = 2.5;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.5 * vol, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  sub.start(now);
  osc.stop(now + 1.05);
  sub.stop(now + 1.05);
};

// 🐰 Bunny Squeak ("Twitch & Hop!")
const playBunny = (ctx, now, vol) => {
  const hops = [0.0, 0.14];

  hops.forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(1650, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.11);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35 * vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  });
};

// ─── Play Fun Toy Pop / Bubble Sound (for clicks & confetti) ─────────────────
export const playPopSound = () => {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

  gain.gain.setValueAtTime(0.25 * masterVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
};

// ─── Main Dispatcher ────────────────────────────────────────────────────────
export const playAnimalSound = (animalType) => {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = masterVolume;

  switch (animalType.toLowerCase()) {
    case 'lion':
      playLion(ctx, now, vol);
      break;
    case 'elephant':
      playElephant(ctx, now, vol);
      break;
    case 'monkey':
      playMonkey(ctx, now, vol);
      break;
    case 'dog':
      playDog(ctx, now, vol);
      break;
    case 'cat':
      playCat(ctx, now, vol);
      break;
    case 'frog':
      playFrog(ctx, now, vol);
      break;
    case 'duck':
      playDuck(ctx, now, vol);
      break;
    case 'cow':
      playCow(ctx, now, vol);
      break;
    case 'fox':
      playFox(ctx, now, vol);
      break;
    case 'panda':
      playPanda(ctx, now, vol);
      break;
    case 'unicorn':
      playUnicorn(ctx, now, vol);
      break;
    case 'owl':
      playOwl(ctx, now, vol);
      break;
    case 'bear':
      playBear(ctx, now, vol);
      break;
    case 'bunny':
      playBunny(ctx, now, vol);
      break;
    default:
      playPopSound();
  }
};

// Optional Speech voice announcement
export const speakAnimalGreeting = (text) => {
  if (getMuted() || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.35; // Cheerful, kid-friendly pitch
    utterance.volume = masterVolume * 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis unavailable or blocked
  }
};
