/**
 * Animates a copy of an image flying from its spot into the header cart icon.
 * Purely decorative: does nothing if either element is missing or the user
 * prefers reduced motion.
 */
export const flyToCart = (imgEl) => {
  const cartEl = document.querySelector('.header__cart-btn');
  if (!imgEl || !cartEl || !imgEl.animate) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const from = imgEl.getBoundingClientRect();
  const to = cartEl.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 160);

  const clone = imgEl.cloneNode();
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '50%',
    zIndex: 2000,
    pointerEvents: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  });
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const anim = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(0.6) rotate(-20deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(-40deg)`, opacity: 0.6 },
    ],
    { duration: 850, easing: 'cubic-bezier(0.55, 0, 0.35, 1)' },
  );

  anim.onfinish = () => {
    clone.remove();
    cartEl.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-10deg)' }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  };
};
