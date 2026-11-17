// Runs work that isn't needed for the first screen (three.js, 3D models,
// sounds, below-the-fold images) once the visitor first interacts with the
// page — or a few seconds after load if they don't — so it never competes
// with the initial render on slow phones.

const EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'scroll', 'wheel'];
const FALLBACK_DELAY_MS = 8000;

let engaged = false;
const callbacks = new Set();

const engage = () => {
  if (engaged) return;
  engaged = true;
  EVENTS.forEach((e) => window.removeEventListener(e, engage, { capture: true }));
  callbacks.forEach((fn) => fn());
  callbacks.clear();
};

if (typeof window !== 'undefined') {
  EVENTS.forEach((e) => window.addEventListener(e, engage, { capture: true, passive: true }));
  const startFallback = () => setTimeout(engage, FALLBACK_DELAY_MS);
  if (document.readyState === 'complete') startFallback();
  else window.addEventListener('load', startFallback, { once: true });
}

export const isEngaged = () => engaged;

// Calls fn once engaged (immediately if already). Returns an unsubscribe.
export const whenEngaged = (fn) => {
  if (engaged) {
    fn();
    return () => {};
  }
  callbacks.add(fn);
  return () => callbacks.delete(fn);
};
