import { useState, useEffect } from 'react';
import { playPopSound } from '../../utils/animalSounds';
import './FloatingBuddy.scss';

const QUOTES = [
  'Animals are hiding on this page — can you find them? 🐾',
  'Tap any animal to hear its real voice! 🐮',
  'Welcome to Kidroo Toys! 🎈',
  'Psst… a dog, a frog and a horse live here! 🐸',
  'Discover the best toys for brain power! 🧠',
  'Yay! Let’s build something fun today! 🚀',
  'Every toy tells a magical story! 🌟',
];

const FloatingBuddy = ({ onScrollToAnimals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress for scroll indicator and bounce
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    setIsJumping(true);
    playPopSound();
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    setIsOpen(true);
    setTimeout(() => {
      setIsJumping(false);
    }, 700);
  };

  if (dismissed) return null;

  return (
    <>
      {/* ─── Top Scroll Progress Bar with Moving Toy Cart ─── */}
      <div className="kidroo-scroll-track" aria-hidden="true">
        <div
          className="kidroo-scroll-bar"
          style={{ width: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
        >
          <span className="kidroo-scroll-toy">🚂</span>
        </div>
      </div>

      {/* ─── Floating Mascot Buddy ─── */}
      <div className="floating-buddy" aria-label="Kidroo Mascot Buddy">
        {isOpen && (
          <div className="floating-buddy__bubble">
            <button
              type="button"
              className="floating-buddy__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close message"
            >
              ×
            </button>
            <p className="floating-buddy__text">{QUOTES[quoteIndex]}</p>
            {onScrollToAnimals && (
              <button
                type="button"
                className="floating-buddy__action"
                onClick={() => {
                  playPopSound();
                  setIsOpen(false);
                  onScrollToAnimals();
                }}
              >
                Find an Animal 🐾
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className={`floating-buddy__btn ${isJumping ? 'is-jumping' : ''}`}
          onClick={handleClick}
          title="Tap me! I'm Sparkle, your Kidroo Buddy"
        >
          <span className="floating-buddy__icon">🦄</span>
          <span className="floating-buddy__badge">Hi!</span>
          <div className="floating-buddy__rings" aria-hidden="true">
            <span />
            <span />
          </div>
        </button>
      </div>
    </>
  );
};

export default FloatingBuddy;
