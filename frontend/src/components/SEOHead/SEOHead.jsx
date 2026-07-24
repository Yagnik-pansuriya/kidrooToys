import { useEffect } from 'react';

/**
 * SEOHead — Dynamically updates document <head> meta tags for SEO.
 *
 * Since this is a Vite + React SPA (no SSR), we manipulate the DOM directly
 * via useEffect. For SSR/prerendering support in the future, consider
 * react-helmet-async or a meta framework like Next.js.
 *
 * Props:
 *  title           {string}  Page title (appended with site name)
 *  description     {string}  Meta description (max ~155 chars for SERP)
 *  keywords        {string}  Comma-separated keywords
 *  canonicalUrl    {string}  Canonical URL for this page
 *  ogType          {string}  Open Graph type (default: 'website')
 *  ogImage         {string}  Open Graph image URL
 *  ogTitle         {string}  OG title override (defaults to title)
 *  ogDescription   {string}  OG description override (defaults to description)
 *  twitterCard     {string}  Twitter card type (default: 'summary_large_image')
 *  jsonLd          {object}  JSON-LD structured data object
 *  noIndex         {boolean} If true, adds noindex,nofollow
 */
const SITE_NAME = 'Kidroo Toys';
const PRODUCTION_DOMAIN = 'https://kidroo.in';
const DEFAULT_DESCRIPTION = 'Kidroo Toys - Where Imagination Comes to Play! Shop premium toys, educational kits, and more for kids of all ages.';

const normalizeCanonical = (url) => {
  if (!url) return `${PRODUCTION_DOMAIN}/`;
  try {
    // Handle relative paths e.g. "/product/toy-slug"
    if (url.startsWith('/')) {
      return `${PRODUCTION_DOMAIN}${url}`;
    }
    const parsed = new URL(url);
    // Force https://kidroo.in production domain for all canonical tags
    return `${PRODUCTION_DOMAIN}${parsed.pathname}${parsed.search}`;
  } catch {
    return `${PRODUCTION_DOMAIN}/`;
  }
};

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage,
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  jsonLd,
  noIndex = false,
}) => {
  useEffect(() => {
    // ── Title ──
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Where Imagination Comes to Play 🧸`;
    document.title = fullTitle;

    // ── Helper to set/remove a <meta> tag ──
    const setMeta = (attr, attrValue, content) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (content) {
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, attrValue);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      } else if (el) {
        el.remove();
      }
    };

    // ── Meta Description ──
    setMeta('name', 'description', description || DEFAULT_DESCRIPTION);

    // ── Meta Keywords ──
    setMeta('name', 'keywords', keywords || '');

    // ── Robots ──
    setMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    // ── Canonical URL ──
    const cleanCanonical = normalizeCanonical(canonicalUrl);
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', cleanCanonical);

    // ── Open Graph ──
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:title', ogTitle || fullTitle);
    setMeta('property', 'og:description', ogDescription || description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:image', ogImage || '');
    setMeta('property', 'og:url', cleanCanonical);

    // ── Twitter Cards ──
    setMeta('name', 'twitter:card', twitterCard);
    setMeta('name', 'twitter:title', ogTitle || fullTitle);
    setMeta('name', 'twitter:description', ogDescription || description || DEFAULT_DESCRIPTION);
    setMeta('name', 'twitter:image', ogImage || '');

    // ── JSON-LD Structured Data ──
    // Supports both a single object and an array of objects
    const JSONLD_ID = 'seo-jsonld';
    // Remove any existing JSON-LD scripts
    document.querySelectorAll(`script[data-seo-jsonld]`).forEach((el) => el.remove());
    const oldScript = document.getElementById(JSONLD_ID);
    if (oldScript) oldScript.remove();

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        const scriptEl = document.createElement('script');
        scriptEl.type = 'application/ld+json';
        scriptEl.setAttribute('data-seo-jsonld', 'true');
        scriptEl.id = `${JSONLD_ID}-${index}`;
        scriptEl.textContent = JSON.stringify(item);
        document.head.appendChild(scriptEl);
      });
    }

    // ── Cleanup on unmount ──
    return () => {
      // Clean up JSON-LD scripts
      document.querySelectorAll(`script[data-seo-jsonld]`).forEach((el) => el.remove());
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, ogTitle, ogDescription, twitterCard, jsonLd, noIndex]);

  return null; // This component renders nothing; it only manages <head>
};

export default SEOHead;
