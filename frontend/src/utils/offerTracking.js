// Storefront offer analytics: batched impression / click beacons + last-click attribution
// for orders. Everything here is best-effort and must never break the page.

const BASE_URL = import.meta.env.VITE_API_URL || '/api/';
const TRACK_URL = `${BASE_URL.replace(/\/?$/, '/')}offers/track`;
const SEEN_KEY = 'kidroo:offers-seen';
const ATTR_KEY = 'kidroo:offer-attribution';
const ATTR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // a click counts toward orders placed within 7 days
const FLUSH_DELAY = 4000;
const MAX_BATCH = 50;

const isValidId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

let queue = [];
let timer = null;
let seen = null;

// One impression per offer per browser session, however often it scrolls into view
const seenSet = () => {
  if (seen) return seen;
  try { seen = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]')); } catch { seen = new Set(); }
  return seen;
};

const flush = () => {
  clearTimeout(timer);
  timer = null;
  if (queue.length === 0) return;
  const events = queue.splice(0, MAX_BATCH);
  try {
    fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true, // survives navigation, e.g. when the click opens another page
    }).catch(() => {});
  } catch { /* offline / blocked */ }
  if (queue.length) flush();
};

const enqueue = (id, type) => {
  queue.push({ id, type });
  if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_DELAY);
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

export const trackOfferImpression = (id) => {
  if (!isValidId(id)) return;
  const s = seenSet();
  if (s.has(id)) return;
  s.add(id);
  try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s])); } catch { /* storage unavailable */ }
  enqueue(id, 'impression');
};

export const trackOfferClick = (id) => {
  if (!isValidId(id)) return;
  enqueue(id, 'click');
  try { localStorage.setItem(ATTR_KEY, JSON.stringify({ id, at: Date.now() })); } catch { /* storage unavailable */ }
  flush();
};

/** Offer id to credit for an order placed now, if the shopper clicked one recently */
export const getAttributedOffer = () => {
  try {
    const { id, at } = JSON.parse(localStorage.getItem(ATTR_KEY) || 'null') || {};
    return isValidId(id) && Date.now() - at < ATTR_WINDOW_MS ? id : undefined;
  } catch {
    return undefined;
  }
};

export const clearOfferAttribution = () => {
  try { localStorage.removeItem(ATTR_KEY); } catch { /* storage unavailable */ }
};
