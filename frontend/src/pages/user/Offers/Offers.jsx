import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCopy, FiCheck, FiArrowRight, FiTag, FiChevronLeft, FiChevronRight, FiClock, FiGift, FiPercent } from 'react-icons/fi';

import { useGetActiveOffersQuery } from '../../../store/ActionApi/offerApi';
import { useGetPublicCouponsQuery } from '../../../store/ActionApi/couponApi';
import { useSubscribeMutation } from '../../../store/ActionApi/newsletterApi';
import { useToast } from '../../../context/ToastContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import SEOHead from '../../../components/SEOHead/SEOHead';
import './Offers.scss';

const safeColor = (c, fb) => /^#[0-9A-Fa-f]{3,6}$/.test(c) ? c : fb;

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

  // ── Carousel state ────────────────────────────────────────────
  const [slideIdx, setSlideIdx] = useState(0);
  const total = offerList.length;
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
  const activeOffer = offerList[slideIdx] || null;
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

  // ── Loading ───────────────────────────────────────────────────
  if (offersLoading) {
    return (
      <div className="offpg">
        <div className="offpg__loading"><div className="offpg__spinner" /><p>Loading deals...</p></div>
      </div>
    );
  }

  const hasContent = offerList.length > 0 || publicCoupons.length > 0;

  return (
    <div className="offpg">
      <SEOHead
        title="Offers & Deals - Kidroo Toys"
        description="Discover amazing deals on kids toys at Kidroo."
        keywords="toy deals, kids toy offers, discount toys"
        canonicalUrl={`${window.location.origin}/offers`}
      />

      {/* ════════ PAGE HEADER ════════ */}
      <div className="offpg__header">
        <div className="offpg__header-inner">
          <h1><FiGift /> Offers & Deals</h1>
          <p>Grab the best deals on premium kids toys before they're gone!</p>
        </div>
      </div>

      {/* ════════ HERO CAROUSEL ════════ */}
      {offerList.length > 0 && activeOffer && (() => {
        const bg = safeColor(activeOffer.styling?.bgColor, '#6C3CE1');
        const txt = safeColor(activeOffer.styling?.textColor, '#FFFFFF');
        const img = activeOffer.images?.[0]?.url || activeOffer.images?.[0];
        return (
          <section className="offpg__hero">
            <div className="offpg__hero-slide" style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}dd 50%, ${bg}aa 100%)` }}>
              {/* Decorative circles */}
              <div className="offpg__hero-deco offpg__hero-deco--1" />
              <div className="offpg__hero-deco offpg__hero-deco--2" />

              <div className="offpg__hero-body">
                <div className="offpg__hero-text" style={{ color: txt }}>
                  <span className="offpg__hero-badge">🔥 Limited Time</span>
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

                  <Link to={activeOffer.targetUrl || '/shop'} className="offpg__hero-cta">
                    Shop This Deal <FiArrowRight />
                  </Link>
                </div>

                {img && (
                  <div className="offpg__hero-visual">
                    <img src={img} alt={activeOffer.title} />
                  </div>
                )}
              </div>

              {/* Carousel controls */}
              {total > 1 && (
                <>
                  <button className="offpg__hero-arrow offpg__hero-arrow--l" onClick={goPrev}><FiChevronLeft /></button>
                  <button className="offpg__hero-arrow offpg__hero-arrow--r" onClick={goNext}><FiChevronRight /></button>
                  <div className="offpg__hero-dots">
                    {offerList.map((_, i) => (
                      <button key={i} className={`offpg__hero-dot${i === slideIdx ? ' offpg__hero-dot--on' : ''}`}
                        onClick={() => setSlideIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })()}

      {/* ════════ OFFERS GRID ════════ */}
      {offerList.length > 1 && (
        <section className="offpg__deals">
          <div className="offpg__container">
            <div className="offpg__sec-head">
              <h2><FiPercent /> All <span>Deals</span></h2>
              <p>Don't miss out on these exclusive offers</p>
            </div>
            <div className="offpg__grid">
              {offerList.map((offer, i) => {
                const bg = safeColor(offer.styling?.bgColor, ['#6C3CE1','#E84393','#00B894','#0984E3','#FF6B35'][i % 5]);
                const txt = safeColor(offer.styling?.textColor, '#fff');
                const img = offer.images?.[0]?.url || offer.images?.[0];
                return (
                  <Link key={offer._id || offer.id} to={offer.targetUrl || '/shop'} className="offpg__card">
                    <div className="offpg__card-img-wrap" style={{ background: `linear-gradient(145deg, ${bg}, ${bg}99)` }}>
                      {img ? (
                        <img src={img} alt={offer.title} className="offpg__card-img" />
                      ) : (
                        <div className="offpg__card-placeholder"><FiGift /></div>
                      )}
                    </div>
                    <div className="offpg__card-body" style={{ borderTop: `3px solid ${bg}` }}>
                      <h3 style={{ color: bg }}>{offer.title}</h3>
                      {offer.subtitle && <p>{offer.subtitle}</p>}
                      <span className="offpg__card-cta" style={{ color: bg }}>
                        View Deal <FiArrowRight />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════ COUPONS ════════ */}
      {publicCoupons.length > 0 && (
        <section className="offpg__coupons">
          <div className="offpg__container">
            <div className="offpg__sec-head">
              <h2><FiTag /> Coupon <span>Codes</span></h2>
              <p>Copy & apply at checkout for instant savings</p>
            </div>
            <div className="offpg__coupon-grid">
              {publicCoupons.map(c => (
                <div key={c._id || c.id} className="offpg__coupon">
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
      {!hasContent && (
        <section className="offpg__empty">
          <div className="offpg__empty-box">
            <span>🎁</span>
            <h3>No Offers Right Now</h3>
            <p>Check back soon — we're always cooking up new deals!</p>
            <Link to="/shop" className="offpg__empty-btn">Browse Products</Link>
          </div>
        </section>
      )}

      {/* ════════ NEWSLETTER ════════ */}
      <section className="offpg__news">
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
