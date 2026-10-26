// ============================================================================
// KIDROO TOYS - Animal Voice System
// Plays the REAL recorded animal sound first, then a friendly voice says
// just the animal's name ("Cow"). UI pops stay synthesized (tiny & instant).
// ============================================================================

import { getAnimal } from '../components/AnimalWorld/animals';

let audioCtx = null;
let isMuted = false;
let masterVolume = 0.85;

const MUTE_KEY = 'kidroo_sound_muted';
export const MUTE_EVENT = 'kidroo:mute-change';

// Initialize or resume AudioContext safely (used for UI pop sounds)
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
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
  if (muted) stopAnimalSound();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MUTE_EVENT, { detail: muted }));
  }
};

export const getMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return isMuted;
  }
};

export const setVolume = (vol) => {
  masterVolume = Math.max(0, Math.min(1, vol));
};

export const getVolume = () => masterVolume;

// ─── Real Recorded Animal Sounds ────────────────────────────────────────────

const clipCache = new Map();
let currentClip = null;
let playToken = 0;

const getClip = (src) => {
  let clip = clipCache.get(src);
  if (!clip) {
    clip = new Audio(src);
    clip.preload = 'auto';
    clipCache.set(src, clip);
  }
  return clip;
};

// Warm the browser cache so the first tap plays instantly
export const preloadAnimalSound = (animalType) => {
  const animal = getAnimal(animalType);
  if (animal && typeof Audio !== 'undefined') getClip(animal.sound);
};

export const stopAnimalSound = () => {
  playToken++;
  if (currentClip) {
    currentClip.pause();
    currentClip.currentTime = 0;
    currentClip = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const playClip = (src, token) =>
  new Promise((resolve) => {
    const clip = getClip(src);
    currentClip = clip;
    clip.volume = masterVolume;
    clip.currentTime = 0;

    const done = () => {
      clip.removeEventListener('ended', done);
      clip.removeEventListener('error', done);
      clearTimeout(guard);
      resolve(token === playToken);
    };
    // Never hang if the browser swallows the 'ended' event
    const guard = setTimeout(done, 8000);
    clip.addEventListener('ended', done);
    clip.addEventListener('error', done);
    clip.play().catch(done);
  });

// Pick a clear, friendly English voice once voices are available
let preferredVoice = null;
const pickVoice = () => {
  if (preferredVoice || !window.speechSynthesis) return preferredVoice;
  const voices = window.speechSynthesis.getVoices();
  preferredVoice =
    voices.find((v) => /en[-_](IN|GB|US)/i.test(v.lang) && /female|samantha|google|zira|heera/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;
  return preferredVoice;
};

export const speakAnimalName = (name) =>
  new Promise((resolve) => {
    if (getMuted() || typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.15;
      utterance.volume = masterVolume;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
      setTimeout(resolve, 3000);
    } catch {
      resolve();
    }
  });

// Real sound → then the animal's name. Resolves when both have finished.
export const playAnimalSound = async (animalType) => {
  const animal = getAnimal(String(animalType).toLowerCase());
  if (!animal) {
    playPopSound();
    return;
  }
  if (getMuted()) return;

  stopAnimalSound();
  const token = playToken;
  const stillCurrent = await playClip(animal.sound, token);
  if (stillCurrent) await speakAnimalName(animal.name);
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

// Kept for older components that speak a full sentence
export const speakAnimalGreeting = (text) => {
  speakAnimalName(text);
};
