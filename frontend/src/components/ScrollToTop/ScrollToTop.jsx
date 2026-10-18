import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures the window automatically scrolls to the top (0, 0)
 * on any route change, query change, or internal link click.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Scroll to the top position immediately
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  // Global click listener for any internal link click
  useEffect(() => {
    const handleGlobalLinkClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore external or new tab links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank'
      ) {
        return;
      }

      // Ignore specific hash anchors like #animal-safari (handled by hash listener)
      if (href.startsWith('#') && href.length > 1) {
        return;
      }

      // Automatically reset scroll to top
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 10);
    };

    document.addEventListener('click', handleGlobalLinkClick, { passive: true });
    return () => document.removeEventListener('click', handleGlobalLinkClick);
  }, []);

  return null;
};

export default ScrollToTop;
