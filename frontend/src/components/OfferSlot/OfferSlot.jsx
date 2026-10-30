import { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiClock, FiX } from 'react-icons/fi';
import { useGetOffersByPageQuery } from '../../store/ActionApi/offerApi';
import { cdnImage } from '../../utils/assetCache';
import { trackOfferImpression, trackOfferClick } from '../../utils/offerTracking';
import './OfferSlot.scss';

// Sections the admin can pick per page (mirrors admin offerConstants.sectionPresets)
const KNOWN_SECTIONS = {
  home: ['hero', 'below-hero', 'between-categories', 'before-footer', 'top-strip'],
  shop: ['top-banner', 'sidebar', 'between-products'],
  product: ['below-gallery', 'related-section'],
  offers: ['hero', 'featured', 'grid'],
  custom: ['custom-1', 'custom-2'],
};

// Which visual layout each section uses
const SECTION_VARIANT = {
  'top-strip': 'strip',
  hero: 'spotlight',
  'top-banner': 'spotlight',
  featured: 'spotlight',
  sidebar: 'compact',
  'below-gallery': 'compact',
};

// ── Helpers ─────────────────────────────────────────────────────
const toHex6 = (c, fallback) => {
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c || '')) return fallback;
  return c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
};

// Darken (amt < 0) or lighten (amt > 0) a #rrggbb colour
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v : 255 - v) * amt)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const imageUrl = (img) => (typeof img === 'string' ? img : img?.url);

const offerTheme = (offer) => {
  const bg = toHex6(offer.styling?.bgColor, '#FF6B35');
  const txt = toHex6(offer.styling?.textColor, '#FFFFFF');
  return {
    '--of-bg': bg,
    '--of-bg-deep': shade(bg, -0.35),
    '--of-bg-soft': shade(bg, 0.55),
    '--of-txt': txt,
    '--of-overlay': Number(offer.styling?.overlayOpacity) || 0,
  };
};

const timeLeft = (to, now) => {
  const end = new Date(to).getTime();
  if (!end || Number.isNaN(end)) return null;
  const ms = end - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d >= 7) {
    return { urgent: false, label: `Valid till ${new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` };
  }
  if (d > 0) return { urgent: d < 2, label: `Ends in ${d}d ${h}h` };
  return { urgent: true, label: `Ends in ${h}h ${m}m` };
};

// Re-render every minute so countdowns stay live
const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
};

// Adds `is-visible` once the slot scrolls into view (drives the entry animation)
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible];
};

// Admin preview renders the real layouts without links or analytics
const PreviewCtx = createContext(false);

const offerId = (o) => o?._id || o?.id;

// Internal paths use the router, absolute URLs open in a new tab
const OfferLink = ({ offer, className, children, ...rest }) => {
  const preview = useContext(PreviewCtx);
  if (preview) return <div className={className} {...rest}>{children}</div>;
  const href = offer?.targetUrl || '/offers';
  const onClick = () => trackOfferClick(offerId(offer));
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} className={className} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>{children}</a>;
  }
  return <Link to={href} className={className} onClick={onClick} {...rest}>{children}</Link>;
};

// Count a view once the offer is actually on screen
const useImpressions = (offers, active) => {
  const preview = useContext(PreviewCtx);
  const ids = offers.map(offerId).join(',');
  useEffect(() => {
    if (!active || preview || !ids) return;
    ids.split(',').forEach(trackOfferImpression);
  }, [ids, active, preview]);
};

const Countdown = ({ offer, now }) => {
  const left = timeLeft(offer.validity?.to, now);
  if (!left) return null;
  return (
    <span className={`offer-slot__timer${left.urgent ? ' offer-slot__timer--urgent' : ''}`}>
      <FiClock /> {left.label}
    </span>
  );
};

// Cross-fading image stack; slider offers cycle through all their images
const OfferImages = ({ offer, width, alt }) => {
  const imgs = (offer.displayType === 'slider' ? offer.images : offer.images?.slice(0, 1)) || [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % imgs.length), 3500);
    return () => clearInterval(t);
  }, [imgs.length]);

  if (imgs.length === 0) return <div className="offer-slot__img-fallback" aria-hidden="true">🎁</div>;
  return (
    <>
      {imgs.map((img, idx) => (
        <img
          key={idx}
          src={cdnImage(imageUrl(img), width)}
          alt={img?.altText || alt}
          className={`offer-slot__img${idx === i ? ' is-active' : ''}`}
          loading="lazy"
          decoding="async"
        />
      ))}
      {imgs.length > 1 && (
        <div className="offer-slot__img-dots" aria-hidden="true">
          {imgs.map((_, idx) => <span key={idx} className={idx === i ? 'is-active' : ''} />)}
        </div>
      )}
    </>
  );
};

// Pointer-follow tilt + glare, written to CSS vars to avoid re-renders
const tiltHandlers = {
  onMouseMove: (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  },
  onMouseLeave: (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  },
};

const Sparkles = () => (
  <span className="offer-slot__sparkles" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map((n) => <i key={n} style={{ '--n': n }} />)}
  </span>
);

// ── Variants ────────────────────────────────────────────────────

// Ticket-style card used in grids
const TicketCard = ({ offer, index, now }) => (
  <OfferLink
    offer={offer}
    className="offer-ticket"
    style={{ ...offerTheme(offer), '--i': index }}
    {...tiltHandlers}
  >
    <span className="offer-ticket__glow" aria-hidden="true" />
    <span className="offer-ticket__body">
      <span className="offer-ticket__media">
        <OfferImages offer={offer} width={700} alt={offer.title} />
        <span className="offer-ticket__ribbon">{offer.badgeText || '🔥 Deal'}</span>
      </span>
      <span className="offer-ticket__perf" aria-hidden="true" />
      <span className="offer-ticket__content">
        <Countdown offer={offer} now={now} />
        <h3 className="offer-ticket__title">{offer.title}</h3>
        {offer.subtitle && <p className="offer-ticket__subtitle">{offer.subtitle}</p>}
        <span className="offer-ticket__cta">{offer.ctaText || 'Grab Offer'} <FiArrowRight /></span>
      </span>
      <span className="offer-slot__shine" aria-hidden="true" />
      <Sparkles />
    </span>
  </OfferLink>
);

// Large carousel banner — one offer at a time
const Spotlight = ({ offers, now, visible }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const total = offers.length;

  const go = useCallback((d) => setIdx((i) => (i + d + total) % total), [total]);

  useEffect(() => { if (idx >= total) setIdx(0); }, [idx, total]);
  useImpressions(offers[idx] ? [offers[idx]] : [], visible);
  useEffect(() => {
    if (total <= 1 || paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go, total, paused, idx]);

  return (
    <div
      className={`offer-spot${paused ? ' is-paused' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {offers.map((offer, i) => (
        <OfferLink
          key={offer._id || offer.id || i}
          offer={offer}
          className={`offer-spot__slide${i === idx ? ' is-active' : ''}`}
          style={offerTheme(offer)}
          aria-hidden={i !== idx}
          tabIndex={i === idx ? 0 : -1}
        >
          <span className="offer-spot__blob offer-spot__blob--a" aria-hidden="true" />
          <span className="offer-spot__blob offer-spot__blob--b" aria-hidden="true" />
          <span className="offer-spot__content">
            <span className="offer-spot__tag">{offer.badgeText || '🎉 Limited Time Offer'}</span>
            <h2 className="offer-spot__title">{offer.title}</h2>
            {offer.subtitle && <p className="offer-spot__subtitle">{offer.subtitle}</p>}
            {offer.description && <p className="offer-spot__desc">{offer.description}</p>}
            <span className="offer-spot__actions">
              <span className="offer-spot__cta">{offer.ctaText || 'Shop the Deal'} <FiArrowRight /></span>
              <Countdown offer={offer} now={now} />
            </span>
          </span>
          <span className="offer-spot__media">
            <span className="offer-spot__frame">
              <OfferImages offer={offer} width={900} alt={offer.title} />
            </span>
          </span>
          <span className="offer-slot__shine" aria-hidden="true" />
          <Sparkles />
        </OfferLink>
      ))}

      {total > 1 && (
        <>
          <button type="button" className="offer-spot__arrow offer-spot__arrow--prev" onClick={() => go(-1)} aria-label="Previous offer"><FiChevronLeft /></button>
          <button type="button" className="offer-spot__arrow offer-spot__arrow--next" onClick={() => go(1)} aria-label="Next offer"><FiChevronRight /></button>
          <div className="offer-spot__dots">
            {offers.map((o, i) => (
              <button
                type="button"
                key={o._id || o.id || i}
                className={`offer-spot__dot${i === idx ? ' is-active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Show offer ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Small stacked cards for sidebars / under the product gallery
const CompactCard = ({ offer, index, now }) => (
  <OfferLink offer={offer} className="offer-compact" style={{ ...offerTheme(offer), '--i': index }}>
    <span className="offer-compact__media"><OfferImages offer={offer} width={300} alt={offer.title} /></span>
    <span className="offer-compact__content">
      {offer.badgeText && <span className="offer-compact__badge">{offer.badgeText}</span>}
      <strong className="offer-compact__title">{offer.title}</strong>
      {offer.subtitle && <span className="offer-compact__subtitle">{offer.subtitle}</span>}
      <Countdown offer={offer} now={now} />
    </span>
    <FiArrowRight className="offer-compact__arrow" />
    <span className="offer-slot__shine" aria-hidden="true" />
  </OfferLink>
);

// Scrolling announcement ticker
const STRIP_KEY = 'kidroo:offer-strip-hidden';
const Strip = ({ offers }) => {
  const preview = useContext(PreviewCtx);
  const [hidden, setHidden] = useState(() => {
    if (preview) return false;
    try { return sessionStorage.getItem(STRIP_KEY) === '1'; } catch { return false; }
  });
  useImpressions(offers, !hidden);
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try { sessionStorage.setItem(STRIP_KEY, '1'); } catch { /* storage unavailable */ }
  };

  // Repeat so the loop is seamless even with a single short offer
  const loop = Array.from({ length: Math.max(2, Math.ceil(6 / offers.length)) }, () => offers).flat();
  return (
    <div className="offer-strip" style={offerTheme(offers[0])}>
      <div className="offer-strip__track" style={{ '--dur': `${Math.max(18, loop.length * 5)}s` }}>
        {[0, 1].map((half) => (
          <div className="offer-strip__group" key={half} aria-hidden={half === 1}>
            {loop.map((o, i) => (
              <OfferLink key={`${half}-${i}`} offer={o} className="offer-strip__item" tabIndex={half === 1 ? -1 : 0}>
                <span className="offer-strip__star">✦</span>
                {o.badgeText && <em className="offer-strip__badge">{o.badgeText}</em>}
                <strong>{o.title}</strong>
                {o.subtitle && <span>{o.subtitle}</span>}
              </OfferLink>
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="offer-strip__close" onClick={preview ? undefined : dismiss} aria-label="Hide announcements"><FiX /></button>
    </div>
  );
};

// ── Slot ────────────────────────────────────────────────────────
/**
 * Renders the admin-managed offers for one page section.
 * @param page      placement.page ('home' | 'shop' | 'product' | ...)
 * @param section   placement.section, or an array of sections
 * @param catchAll  also show offers whose section isn't a known preset for the page
 *                  (older offers default to 'main'), so nothing the admin adds goes missing
 * @param variant   force a layout instead of the one derived from the section
 */
const OfferSlot = ({ page, section, catchAll = false, variant, title, className = '' }) => {
  const { data } = useGetOffersByPageQuery(page);
  const now = useNow();

  const offers = useMemo(() => {
    const raw = data?.data || data || [];
    if (!Array.isArray(raw)) return [];
    const wanted = Array.isArray(section) ? section : [section];
    const known = KNOWN_SECTIONS[page] || [];
    return raw
      .filter((o) => {
        const s = o.placement?.section;
        return wanted.includes(s) || (catchAll && !known.includes(s));
      })
      .filter((o) => !o.validity?.to || new Date(o.validity.to).getTime() > now)
      .sort((a, b) => (a.placement?.position || 0) - (b.placement?.position || 0));
  }, [data, page, section, catchAll, now]);

  if (offers.length === 0) return null;

  const primary = Array.isArray(section) ? section[0] : section;
  return (
    <OfferLayout
      offers={offers}
      layout={variant || SECTION_VARIANT[primary] || 'cards'}
      title={title}
      className={className}
      now={now}
    />
  );
};

const OfferLayout = ({ offers, layout: wanted, title, className = '', now }) => {
  const [ref, visible] = useInView();
  // A lone offer in a grid slot looks better as a full-width spotlight
  const layout = wanted === 'cards' && offers.length === 1 ? 'spotlight' : wanted;
  useImpressions(layout === 'cards' || layout === 'compact' ? offers : [], visible);

  if (layout === 'strip') return <Strip offers={offers} />;

  return (
    <section
      ref={ref}
      className={`offer-slot offer-slot--${layout}${visible ? ' is-visible' : ''} ${className}`.trim()}
      aria-label={title || 'Special offers'}
    >
      {title && layout === 'cards' && (
        <div className="offer-slot__head">
          <span className="offer-slot__chip">🎁 Hot Deals</span>
          <h2 className="offer-slot__heading">{title}</h2>
        </div>
      )}
      {layout === 'spotlight' && <Spotlight offers={offers} now={now} visible={visible} />}
      {layout === 'cards' && (
        <div className={`offer-slot__grid offer-slot__grid--n${Math.min(offers.length, 4)}`}>
          {offers.map((o, i) => <TicketCard key={o._id || o.id || i} offer={o} index={i} now={now} />)}
        </div>
      )}
      {layout === 'compact' && (
        <div className="offer-slot__stack">
          {offers.map((o, i) => <CompactCard key={o._id || o.id || i} offer={o} index={i} now={now} />)}
        </div>
      )}
    </section>
  );
};

/**
 * Admin-side preview: renders offers exactly as the storefront slot would, without links or tracking.
 * @param section  placement.section — picks the same layout the storefront uses
 */
export const OfferSlotPreview = ({ offers, section, title }) => (
  <PreviewCtx.Provider value>
    <OfferLayout
      offers={offers}
      layout={SECTION_VARIANT[section] || 'cards'}
      title={title}
      className="offer-slot--preview is-visible"
      now={Date.now()}
    />
  </PreviewCtx.Provider>
);

export default OfferSlot;
