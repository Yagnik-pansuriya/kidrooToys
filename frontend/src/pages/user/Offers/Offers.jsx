import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiCopy, FiCheck, FiArrowRight, FiTag, FiChevronLeft, FiChevronRight, FiClock, FiGift, FiPercent } from 'react-icons/fi';

import { useGetActiveOffersQuery } from '../../../store/ActionApi/offerApi';
import { useGetPublicCouponsQuery } from '../../../store/ActionApi/couponApi';
import { useSubscribeMutation } from '../../../store/ActionApi/newsletterApi';
import { useToast } from '../../../context/ToastContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import SEO from '../../../components/SEO/SEO';
import { buildOfferSeo } from '../../../utils/offerSeo';
import { useScrollReveal } from '../../../utils/useScrollReveal';
import OfferGate from '../../../components/OfferGate/OfferGate';
import { canShowGate } from '../../../components/OfferGate/canShowGate';
import { trackOfferImpression, trackOfferClick } from '../../../utils/offerTracking';
import './Offers.scss';

const safeColor = (c, fb) => /^#[0-9A-Fa-f]{3,6}$/.test(c) ? c : fb;

const isExternal = (url) => /^https?:\/\//i.test(url || '');

// Router link for internal paths, new tab for absolute URLs; records the click either way
// eslint-disable-next-line react/prop-types
const OfferHref = ({ offer, fallback = '/shop', children, ...rest }) => {
  const to = offer.targetUrl || fallback;
  const onClick = () => trackOfferClick(offer._id || offer.id);
  return isExternal(to)
    ? <a href={to} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>{children}</a>
    : <Link to={to} onClick={onClick} {...rest}>{children}</Link>;
};

// Records one impression when the element is at least half on screen
const useTrackOnView = (id) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !id) return;
    if (typeof IntersectionObserver === 'undefined') { trackOfferImpression(id); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { trackOfferImpression(id); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return ref;
};

// eslint-disable-next-line react/prop-types
const DealCard = ({ offer, index }) => {
  const ref = useTrackOnView(offer._id || offer.id);
  const bg = safeColor(offer.styling?.bgColor, ['#6C3CE1', '#E84393', '#00B894', '#0984E3', '#FF6B35'][index % 5]);
  const img = offer.images?.[0]?.url || offer.images?.[0];
  return (
    <OfferHref offer={offer} className="offpg__card" data-reveal style={{ '--rd': `${(index % 4) * 0.08}s` }}>
      <div ref={ref} className="offpg__card-img-wrap" style={{ background: `linear-gradient(145deg, ${bg}, ${bg}99)` }}>
        {img ? (
          <img src={img} alt={offer.images?.[0]?.altText || offer.title} className="offpg__card-img" loading="lazy" />
        ) : (
          <div className="offpg__card-placeholder"><FiGift /></div>
        )}
        {offer.badgeText && <span className="offpg__card-badge" style={{ background: bg }}>{offer.badgeText}</span>}
      </div>
      <div className="offpg__card-body" style={{ borderTop: `3px solid ${bg}` }}>
        <h3 style={{ color: bg }}>{offer.title}</h3>
        {offer.subtitle && <p>{offer.subtitle}</p>}
        <span className="offpg__card-cta" style={{ color: bg }}>
          {offer.ctaText || 'View Deal'} <FiArrowRight />
        </span>
      </div>
    </OfferHref>
  );
};

const HERO_SECTIONS = ['hero', 'featured'];

const DECOR_TOYS = ['🧸', '🪀', '🎈', '🚂', '🧩', '🪁', '🎨', '⭐'];

// Toy emojis drifting behind a section
// eslint-disable-next-line react/prop-types
const FloatingToys = ({ count = 6, seed = 0 }) => (
  <div className="offpg__floaties" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <span key={i} style={{
        '--x': `${(i * 37 + seed * 23) % 100}%`,
        '--y': `${(i * 53 + seed * 17) % 90}%`,
        '--d': `${(i % 4) * 1.3}s`,
        '--s': `${6 + (i % 3) * 2}s`,
      }}>{DECOR_TOYS[(i + seed) % DECOR_TOYS.length]}</span>
    ))}
  </div>
);

const Offers = () => {
  const { data: offersResp, isFetching: offersLoading } = useGetActiveOffersQuery();
  const { data: couponsResp } = useGetPublicCouponsQuery();

  const offerList = useMemo(() => {
    const raw = offersResp?.data || offersResp || [];
    return Array.isArray(raw) ? raw : [];
  }, [offersResp]);

  const publicCoupons = useMemo(() => {
    const raw = couponsResp?.data || couponsResp || [];
    return Array.isArray(raw) ? raw : [];
  }, [couponsResp]);

  // Hero carousel: offers the admin placed on this page's hero/featured slots,
  // otherwise every live offer
  const heroOffers = useMemo(() => {
    const placed = offerList
      .filter((o) => o.placement?.page === 'offers' && HERO_SECTIONS.includes(o.placement?.section))
      .sort((a, b) =>
        HERO_SECTIONS.indexOf(a.placement.section) - HERO_SECTIONS.indexOf(b.placement.section)
        || (a.placement.position || 0) - (b.placement.position || 0));
    return placed.length ? placed : offerList;
  }, [offerList]);

  // ── Carousel state ────────────────────────────────────────────
  const [slideIdx, setSlideIdx] = useState(0);
  const total = heroOffers.length;
  const goNext = useCallback(() => setSlideIdx(i => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setSlideIdx(i => (i - 1 + total) % total), [total]);

  // Auto-play carousel
  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [goNext, total]);

  // Reset index if offers change
  useEffect(() => { setSlideIdx(0); }, [total]);

  // Countdown
  const activeOffer = heroOffers[slideIdx] || null;
  const heroRef = useRef(null);
  const heroShown = !offersLoading && !!activeOffer;
  const [heroOnScreen, setHeroOnScreen] = useState(false);
  useEffect(() => {
    if (!heroShown) return;
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setHeroOnScreen(true); return; }
    const io = new IntersectionObserver(([e]) => setHeroOnScreen(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [heroShown]);
  useEffect(() => {
    if (heroOnScreen && activeOffer) trackOfferImpression(activeOffer._id || activeOffer.id);
  }, [heroOnScreen, activeOffer]);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0 });
  useEffect(() => {
    if (!activeOffer?.validity?.to) return;
    const end = new Date(activeOffer.validity.to).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
      });
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [activeOffer]);

  // ── Other state ───────────────────────────────────────────────
  const [copiedCode, setCopiedCode] = useState('');
  const [email, setEmail] = useState('');
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const { showSuccess, showError } = useToast();
  const { requireAuth } = useCustomerAuth();
  const [showGate, setShowGate] = useState(canShowGate);
  const pageRef = useRef(null);
  useScrollReveal(pageRef, [offerList, publicCoupons, offersLoading]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!requireAuth('Please login to subscribe')) return;
    if (!email.trim()) return;
    try {
      await subscribe(email.trim()).unwrap();
      showSuccess('🎉 Welcome to the Kidroo family!');
      setEmail('');
    } catch (err) {
      showError(err?.data?.message || 'Subscription failed');
    }
  };

  const hasContent = offerList.length > 0 || publicCoupons.length > 0;

  // SEO follows whatever offers / coupons are live right now
  const offerSeo = useMemo(() => {
    const { title, description, image, catalog } = buildOfferSeo(offerList, publicCoupons);
    const crumbs = [
      { name: 'Home', url: 'https://kidroo.in/' },
      { name: 'Offers & Deals', url: 'https://kidroo.in/offers' },
    ];
    const keywords = [
      'toy offers', 'kids toys sale', 'toy deals india', 'discount toys online', 'kidroo offers',
      ...offerList.map((o) => o.title?.toLowerCase()).filter(Boolean),
      ...publicCoupons.map((c) => `kidroo coupon ${c.code}`.toLowerCase()),
    ].slice(0, 15).join(', ');
    const graph = [
      {
        '@type': 'CollectionPage',
        url: 'https://kidroo.in/offers',
        name: title,
        description,
        isPartOf: { '@id': 'https://kidroo.in/#website' },
        ...(catalog ? { mainEntity: { '@id': catalog['@id'] } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
      },
      ...(catalog ? [catalog] : []),
    ];
    return { title, description, image, keywords, jsonLd: { '@context': 'https://schema.org', '@graph': graph } };
  }, [offerList, publicCoupons]);

  return (
    <div className={`offpg${showGate ? ' offpg--gate' : ''}`} ref={pageRef}>
      <SEO
        title={offerSeo.title}
        description={offerSeo.description}
        keywords={offerSeo.keywords}
        image={offerSeo.image}
        canonical="https://kidroo.in/offers"
        jsonLd={offerSeo.jsonLd}
      />

      {/* ════════ TOY GATE / PAGE HEADER ════════ */}
      {showGate ? (
        <OfferGate
          dealCount={offerList.length + publicCoupons.length}
          loading={offersLoading}
          targetId="offer-deals"
          onFail={() => setShowGate(false)}
        />
      ) : (
        <div className="offpg__header">
          <div className="offpg__header-inner">
            <h1><FiGift /> Offers & Deals</h1>
            <p>Grab the best deals on premium kids toys before they're gone!</p>
          </div>
        </div>
      )}

      <div id="offer-deals" className="offpg__content">
      {offersLoading && (
        <div className="offpg__loading"><div className="offpg__spinner" /><p>Loading deals...</p></div>
      )}

      {/* ════════ HERO CAROUSEL ════════ */}
      {!offersLoading && offerList.length > 0 && activeOffer && (() => {
        const bg = safeColor(activeOffer.styling?.bgColor, '#6C3CE1');
        const txt = safeColor(activeOffer.styling?.textColor, '#FFFFFF');
        const img = activeOffer.images?.[0]?.url || activeOffer.images?.[0];
        return (
          <section className="offpg__hero" data-reveal ref={heroRef}>
            <div className="offpg__hero-slide" style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}dd 50%, ${bg}aa 100%)` }}>
              {/* Decorative circles */}
              <div className="offpg__hero-deco offpg__hero-deco--1" />
              <div className="offpg__hero-deco offpg__hero-deco--2" />

              <div className="offpg__hero-body" key={slideIdx}>
                <div className="offpg__hero-text" style={{ color: txt }}>
                  <span className="offpg__hero-badge">{activeOffer.badgeText || '🔥 Limited Time'}</span>
                  <h2 className="offpg__hero-title">{activeOffer.title}</h2>
                  {activeOffer.subtitle && <p className="offpg__hero-sub">{activeOffer.subtitle}</p>}
                  {activeOffer.description && <p className="offpg__hero-desc">{activeOffer.description}</p>}

                  {activeOffer.validity?.to && (
                    <div className="offpg__hero-timer">
                      <FiClock />
                      <div className="offpg__hero-timer-item"><span>{String(countdown.d).padStart(2,'0')}</span><small>Days</small></div>
                      <div className="offpg__hero-timer-sep">:</div>
                      <div className="offpg__hero-timer-item"><span>{String(countdown.h).padStart(2,'0')}</span><small>Hrs</small></div>
                      <div className="offpg__hero-timer-sep">:</div>
                      <div className="offpg__hero-timer-item"><span>{String(countdown.m).padStart(2,'0')}</span><small>Min</small></div>
                    </div>
                  )}

                  <OfferHref offer={activeOffer} className="offpg__hero-cta">
                    {activeOffer.ctaText || 'Shop This Deal'} <FiArrowRight />
                  </OfferHref>
                </div>

                {img && (
                  <div className="offpg__hero-visual">
                    <img src={img} alt={activeOffer.images?.[0]?.altText || activeOffer.title} />
                  </div>
                )}
              </div>

              {/* Carousel controls */}
              {total > 1 && (
                <>
                  <button className="offpg__hero-arrow offpg__hero-arrow--l" onClick={goPrev} aria-label="Previous offer"><FiChevronLeft /></button>
                  <button className="offpg__hero-arrow offpg__hero-arrow--r" onClick={goNext} aria-label="Next offer"><FiChevronRight /></button>
                  <div className="offpg__hero-dots">
                    {heroOffers.map((_, i) => (
                      <button key={i} className={`offpg__hero-dot${i === slideIdx ? ' offpg__hero-dot--on' : ''}`}
                        onClick={() => setSlideIdx(i)} aria-label={`Show offer ${i + 1}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })()}

      {/* ════════ OFFERS GRID ════════ */}
      {!offersLoading && offerList.length > 1 && (
        <section className="offpg__deals">
          <FloatingToys count={7} seed={1} />
          <div className="offpg__container">
            <div className="offpg__sec-head" data-reveal>
              <h2><FiPercent /> All <span>Deals</span></h2>
              <p>Don't miss out on these exclusive offers</p>
            </div>
            <div className="offpg__grid">
              {offerList.map((offer, i) => (
                <DealCard key={offer._id || offer.id} offer={offer} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ COUPONS ════════ */}
      {publicCoupons.length > 0 && (
        <section className="offpg__coupons">
          <FloatingToys count={6} seed={4} />
          <div className="offpg__container">
            <div className="offpg__sec-head" data-reveal>
              <h2><FiTag /> Coupon <span>Codes</span></h2>
              <p>Copy & apply at checkout for instant savings</p>
            </div>
            <div className="offpg__coupon-grid">
              {publicCoupons.map((c, i) => (
                <div key={c._id || c.id} className="offpg__coupon"
                  data-reveal style={{ '--rd': `${(i % 3) * 0.1}s` }}>
                  <div className="offpg__coupon-left">
                    <div className="offpg__coupon-amount">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </div>
                    <div className="offpg__coupon-off">OFF</div>
                  </div>
                  <div className="offpg__coupon-right">
                    <p className="offpg__coupon-desc">{c.description}</p>
                    <div className="offpg__coupon-meta">
                      {c.minOrderAmount > 0 && <span>Min Order: ₹{c.minOrderAmount}</span>}
                      {c.minQuantity > 0 && <span>Min Qty: {c.minQuantity} items</span>}
                      <span>Till {new Date(c.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="offpg__coupon-code-row">
                      <code>{c.code}</code>
                      <button onClick={() => copyCode(c.code)}>
                        {copiedCode === c.code ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ EMPTY ════════ */}
      {!showGate && !offersLoading && !hasContent && (
        <section className="offpg__empty">
          <div className="offpg__empty-box">
            <span className="offpg__empty-gift">🎁</span>
            <h3>No Offers Right Now</h3>
            <p>Check back soon — we're always cooking up new deals!</p>
            <Link to="/shop" className="offpg__empty-btn">Browse Products</Link>
          </div>
        </section>
      )}

      </div>

      {/* ════════ NEWSLETTER ════════ */}
      <section className="offpg__news" data-reveal>
        <div className="offpg__container">
          <div className="offpg__news-inner">
            <div>
              <h2>🎉 Get Exclusive Deals</h2>
              <p>Subscribe and get <strong>₹200 OFF</strong> your first order over ₹999</p>
            </div>
            <form onSubmit={handleSubscribe} className="offpg__news-form">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <button type="submit" disabled={subscribing}>
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Offers;
