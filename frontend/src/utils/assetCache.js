// ============================================================================
// KIDROO TOYS - Asset cache helpers
// • registerServiceWorker(): installs public/sw.js (production only), which
//   keeps models, sounds, bundles and images on the device between visits.
// • warmAssets(): quietly downloads files the user will need soon (all 3D
//   animals, their sounds, images further down the page) once the page is
//   idle, so scrolling never waits on the network.
// • cdnImage(): asks Cloudinary for a resized, auto-format (WebP/AVIF) copy.
// ============================================================================

import { ANIMALS } from '../components/AnimalWorld/animals';

export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Caching is an enhancement — the site works the same without it
    });
  });
};

// Respect data-saver and very slow connections
const shouldSkipWarmup = () => {
  const conn = navigator.connection;
  return Boolean(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));
};

const onIdle = (fn) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 4000 });
  else setTimeout(fn, 1500);
};

const warmed = new Set();

// Resolves when the file is fully downloaded (or failed) — never rejects
const warmUrl = (url) =>
  new Promise((resolve) => {
    warmed.add(url);
    if (/\.(glb|gltf|mp3|ogg|wav)(\?|$)/i.test(url)) {
      fetch(url, { priority: 'low' })
        .then((res) => res.arrayBuffer())
        .catch(() => warmed.delete(url))
        .finally(resolve);
      return;
    }
    // Same request the <img> will make later, so the cached copy is reused
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });

// Download one file at a time, only while the browser is idle, so warming
// never competes with what the user is looking at right now.
const queue = [];
let running = false;

const runQueue = () => {
  if (running) return;
  running = true;
  const next = async () => {
    const url = queue.shift();
    if (!url) {
      running = false;
      return;
    }
    await warmUrl(url);
    onIdle(next);
  };
  onIdle(next);
};

export const warmAssets = (urls) => {
  if (typeof window === 'undefined' || shouldSkipWarmup()) return;
  urls.filter((u) => u && !warmed.has(u) && !queue.includes(u)).forEach((u) => queue.push(u));
  if (document.readyState === 'complete') runQueue();
  else window.addEventListener('load', runQueue, { once: true });
};

export const warmAnimalAssets = () => warmAssets(ANIMALS.flatMap((a) => [a.model, a.sound]));

// Cloudinary delivers a resized, auto-format/quality copy when the URL asks
// for it. URLs that already carry transformations (or aren't Cloudinary) are
// returned unchanged.
export const cdnImage = (url, width) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const [head, tail] = url.split('/upload/');
  const firstSegment = tail.split('/')[0];
  if (/^[a-z]{1,3}_[^/]*/.test(firstSegment) && !/^v\d+$/.test(firstSegment)) return url;
  return `${head}/upload/f_auto,q_auto,c_limit,w_${width}/${tail}`;
};
