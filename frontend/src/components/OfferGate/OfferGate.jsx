/* eslint-disable react/prop-types */
import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowDown, FiGift } from 'react-icons/fi';
import './OfferGate.scss';

const GateScene = lazy(() => import('./GateScene'));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const stageFor = (p) => (p < 0.1 ? 'intro' : p < 0.7 ? 'opening' : 'revealed');

/**
 * Scroll-driven 3D toy gate. The section is several screens tall; its stage
 * sticks to the viewport while scrolling unties the bow, swings the crayon
 * doors open and flies the camera through to the prize box.
 */
const OfferGate = ({ dealCount = 0, loading = false, targetId, onFail }) => {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const progressRef = useRef({ target: 0 });
  const [stage, setStage] = useState('intro');
  const [active, setActive] = useState(true);
  const hasOffers = dealCount > 0;

  useEffect(() => {
    const update = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / span));
      progressRef.current.target = p;
      stageRef.current?.style.setProperty('--p', p.toFixed(4));
      setStage(stageFor(p));
      setActive(rect.bottom > 0 && rect.top < window.innerHeight);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const openGate = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const end = wrap.offsetTop + wrap.offsetHeight - window.innerHeight;
    window.scrollTo({ top: end, behavior: 'smooth' });
  };

  const goToDeals = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={wrapRef} className={`ogate ogate--${stage}`} aria-label="Offers gate">
      <div ref={stageRef} className="ogate__stage">
        <div className="ogate__canvas">
          <SceneBoundary onFail={onFail}>
            <Suspense fallback={<div className="ogate__canvas-loading"><span>🎁</span></div>}>
              <GateScene progressRef={progressRef} hasOffers={hasOffers} active={active} />
            </Suspense>
          </SceneBoundary>
        </div>

        <div className="ogate__intro">
          <span className="ogate__kicker"><FiGift /> The Kidroo Toy Gate</span>
          <h1 className="ogate__title">
            {'Offers & Deals'.split('').map((ch, i) => (
              <span key={i} style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>
            ))}
          </h1>
          <p className="ogate__sub">Something fun is locked behind this gate… untie the bow to peek inside!</p>
          <button type="button" className="ogate__btn" onClick={openGate}>
            Open the gate <FiArrowDown />
          </button>
        </div>

        <div className="ogate__hint" aria-hidden="true">
          <span className="ogate__mouse"><span /></span>
          <small>Scroll to unlock</small>
        </div>

        <div className="ogate__reveal" aria-live="polite">
          {loading ? (
            <h2 className="ogate__reveal-title">Counting your treats… 🧮</h2>
          ) : hasOffers ? (
            <>
              <span className="ogate__reveal-badge">🎉 Unlocked!</span>
              <h2 className="ogate__reveal-title">
                {dealCount} {dealCount === 1 ? 'deal' : 'deals'} waiting for you
              </h2>
              <p className="ogate__reveal-sub">Fresh savings on toys, games & gifts — grab them before they&apos;re gone.</p>
              <button type="button" className="ogate__btn" onClick={goToDeals}>
                See the deals <FiArrowDown />
              </button>
            </>
          ) : (
            <>
              <span className="ogate__reveal-badge ogate__reveal-badge--soft">💤 Shh… the box is napping</span>
              <h2 className="ogate__reveal-title">No offers right now</h2>
              <p className="ogate__reveal-sub">Our toy elves are busy wrapping new deals. Peek back soon!</p>
              <Link to="/shop" className="ogate__btn">Browse toys</Link>
            </>
          )}
        </div>

        <div className="ogate__progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
};

export default OfferGate;
