import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiCopy, FiCheck, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useSelector } from 'react-redux';

import { useGetOffersQuery } from '../../../store/ActionApi/offerApi';
import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useSubscribeMutation } from '../../../store/ActionApi/newsletterApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import './Offers.scss';

const Offers = () => {
  // ── API data ────────────────────────────────────────────────────
  const { isFetching: offersLoading } = useGetOffersQuery();
  useGetProductsQuery({ page: 1, limit: 8 });

  const offers = useSelector((s) => s.offer.offers) || [];
  const offerList = Array.isArray(offers) ? offers : offers?.data || [];
  const activeOffers = offerList.filter((o) => o.isActive);

  const products = useSelector((s) => s.product.products) || [];
  const productList = Array.isArray(products) ? products : products?.data || [];

  // ── State ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all-deals');
  const [copiedCode, setCopiedCode] = useState('');
  const [email, setEmail] = useState('');
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  // ── Derived data ────────────────────────────────────────────────
  const heroOffer = useMemo(() => activeOffers.find((o) => o.isFeatured) || activeOffers[0], [activeOffers]);

  const filteredOffers = useMemo(() => {
    if (activeTab === 'all-deals') return activeOffers;
    return activeOffers.filter((o) => o.offerCategory === activeTab);
  }, [activeOffers, activeTab]);

  // Find the first buyable/post offer for featured spotlight
  const spotlightOffer = useMemo(() => filteredOffers.find((o) => o.type === 'buyable' || o.type === 'post'), [filteredOffers]);

  // Find a coupon offer for the coupon card
  const couponOffer = useMemo(() => activeOffers.find((o) => o.couponCode), [activeOffers]);

  // Products with discounts for the "All Offers" grid
  const discountedProducts = useMemo(() =>
    productList.filter((p) => {
      const price = Number(p.price || 0);
      const original = Number(p.originalPrice || 0);
      return original > price || p.discountPercentage > 0;
    }).slice(0, 8),
    [productList]
  );

  // ── Countdown Timer ─────────────────────────────────────────────
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!heroOffer?.validity?.to) return;
    const endDate = new Date(heroOffer.validity.to);

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, endDate.getTime() - now.getTime());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heroOffer]);

  // ── Handlers ────────────────────────────────────────────────────
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await subscribe(email.trim()).unwrap();
      showSuccess('🎉 Welcome to the Kidroo family!');
      setEmail('');
    } catch (err) {
      showError(err?.data?.message || 'Subscription failed');
    }
  };

  const tabs = [
    { key: 'all-deals', label: 'All Deals' },
    { key: 'flash-sale', label: 'Flash Sale' },
    { key: 'clearance', label: 'Clearance' },
  ];

  // ── Render ──────────────────────────────────────────────────────
  if (offersLoading) {
    return (
      <div className="offers-v3">
        <div className="offers-v3__loading">
          <div className="offers-v3__spinner" />
          <p>Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-v3">

      {/* ═══════════ HERO BANNER ═══════════ */}
      {heroOffer && (
        <section
          className="offers-v3__hero"
          style={{ background: `linear-gradient(135deg, ${heroOffer.bgColor || '#FF6B35'}, ${heroOffer.bgColor || '#FF6B35'}cc, #F7931E)` }}
        >
          <div className="offers-v3__hero-container">
            <div className="offers-v3__hero-left">
              {heroOffer.offerTag && (
                <span className="offers-v3__hero-tag">{heroOffer.offerTag}</span>
              )}
              <h1 className="offers-v3__hero-title" style={{ color: heroOffer.textColor || '#fff' }}>
                {heroOffer.title}
              </h1>
              {heroOffer.subtitle && (
                <p className="offers-v3__hero-subtitle" style={{ color: heroOffer.textColor || '#fff' }}>{heroOffer.subtitle}</p>
              )}

              {/* Countdown Timer */}
              {heroOffer.validity?.to && (
                <div className="offers-v3__countdown">
                  <div className="offers-v3__countdown-item">
                    <span className="offers-v3__countdown-num">{String(countdown.days).padStart(2, '0')}</span>
                    <span className="offers-v3__countdown-label">DAYS</span>
                  </div>
                  <div className="offers-v3__countdown-item">
                    <span className="offers-v3__countdown-num">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="offers-v3__countdown-label">HOURS</span>
                  </div>
                  <div className="offers-v3__countdown-item">
                    <span className="offers-v3__countdown-num">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="offers-v3__countdown-label">MINS</span>
                  </div>
                </div>
              )}

              <Link to={heroOffer.targetUrl || '/shop'} className="offers-v3__hero-btn">
                Shop the Sale
              </Link>
            </div>

            <div className="offers-v3__hero-right">
              {(heroOffer.image || heroOffer.images || [])[0] && (
                <img
                  src={(heroOffer.image || heroOffer.images)[0]}
                  alt={heroOffer.title}
                  className="offers-v3__hero-img"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ FILTER TABS ═══════════ */}
      <section className="offers-v3__tabs-section">
        <div className="offers-v3__container">
          <div className="offers-v3__tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`offers-v3__tab ${activeTab === tab.key ? 'offers-v3__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SPOTLIGHT + COUPON ═══════════ */}
      {(spotlightOffer || couponOffer) && (
        <section className="offers-v3__spotlight-section">
          <div className="offers-v3__container offers-v3__spotlight-grid">

            {/* Spotlight Product Card */}
            {spotlightOffer && (
              <div className="offers-v3__spotlight-card">
                <div className="offers-v3__spotlight-img-wrap">
                  {(spotlightOffer.image || spotlightOffer.images || [])[0] && (
                    <img
                      src={(spotlightOffer.image || spotlightOffer.images)[0]}
                      alt={spotlightOffer.title}
                      className="offers-v3__spotlight-img"
                    />
                  )}
                </div>
                <div className="offers-v3__spotlight-content">
                  <div className="offers-v3__spotlight-tags">
                    {spotlightOffer.offerTag && (
                      <span className="offers-v3__stag offers-v3__stag--stock">{spotlightOffer.offerTag}</span>
                    )}
                    {spotlightOffer.offerCategory === 'flash-sale' && (
                      <span className="offers-v3__stag offers-v3__stag--flash">Flash Deal</span>
                    )}
                  </div>
                  <h3 className="offers-v3__spotlight-title">{spotlightOffer.title}</h3>
                  <p className="offers-v3__spotlight-desc">{spotlightOffer.description}</p>
                  <div className="offers-v3__spotlight-pricing">
                    {spotlightOffer.discountPercentage > 0 && (
                      <span className="offers-v3__spotlight-discount">-{spotlightOffer.discountPercentage}%</span>
                    )}
                  </div>
                  <Link to={spotlightOffer.targetUrl || '/shop'} className="offers-v3__spotlight-btn">
                    Shop Now <FiArrowRight />
                  </Link>
                </div>
              </div>
            )}

            {/* Coupon Code Card */}
            {couponOffer && (
              <div className="offers-v3__coupon-card">
                <div className="offers-v3__coupon-icon">🏷️</div>
                <h3 className="offers-v3__coupon-title">
                  Extra {couponOffer.discountPercentage || 10}% OFF
                </h3>
                <p className="offers-v3__coupon-desc">
                  {couponOffer.couponDescription || 'Apply this code at checkout for additional savings on all items.'}
                </p>
                <div className="offers-v3__coupon-code-wrap">
                  <span className="offers-v3__coupon-code">{couponOffer.couponCode}</span>
                  <button
                    className="offers-v3__coupon-copy"
                    onClick={() => copyCode(couponOffer.couponCode)}
                  >
                    {copiedCode === couponOffer.couponCode ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy Code</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════ ALL OFFERS GRID ═══════════ */}
      <section className="offers-v3__products-section">
        <div className="offers-v3__container">
          <div className="offers-v3__products-header">
            <h2 className="offers-v3__section-title">
              All <span>Offers</span>
            </h2>
            <div className="offers-v3__products-sort">
              Sort By: <strong>Biggest Discount</strong>
            </div>
          </div>

          {discountedProducts.length === 0 && activeOffers.length === 0 ? (
            <div className="offers-v3__empty">
              <div className="offers-v3__empty-icon">🎁</div>
              <h3>No Offers Available</h3>
              <p>Check back soon for amazing deals!</p>
              <Link to="/shop" className="offers-v3__empty-btn">Browse Products</Link>
            </div>
          ) : (
            <div className="offers-v3__products-grid">
              {discountedProducts.map((product) => {
                const name = product.productName || product.name;
                const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                const price = Number(product.price || 0);
                const originalPrice = Number(product.originalPrice || 0);
                const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);

                return (
                  <div className="offers-v3__product-card" key={product._id || product.id}>
                    {discount > 0 && (
                      <span className="offers-v3__product-badge">{discount}% OFF</span>
                    )}
                    <div className="offers-v3__product-img-wrap">
                      {imgSrc ? (
                        <img src={imgSrc} alt={name} className="offers-v3__product-img" loading="lazy" />
                      ) : (
                        <div className="offers-v3__product-placeholder">📦</div>
                      )}
                      <div className="offers-v3__product-overlay">
                        <button
                          className="offers-v3__product-cart-btn"
                          onClick={() => addToCart(product)}
                        >
                          <FiShoppingCart /> Add to Cart
                        </button>
                      </div>
                    </div>
                    <Link to={`/product/${product._id || product.id}`} className="offers-v3__product-info">
                      <h4 className="offers-v3__product-name">{name}</h4>
                      <div className="offers-v3__product-pricing">
                        <span className="offers-v3__product-price">₹{price.toFixed(0)}</span>
                        {originalPrice > price && (
                          <span className="offers-v3__product-original">₹{originalPrice.toFixed(0)}</span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ NEWSLETTER ═══════════ */}
      <section className="offers-v3__newsletter">
        <div className="offers-v3__container offers-v3__newsletter-inner">
          <div className="offers-v3__newsletter-text">
            <h2>Join Kidroo Club</h2>
            <p>Sign up for our newsletter and get an extra <strong>₹200 OFF</strong> on your first order over ₹999.</p>
          </div>
          <form className="offers-v3__newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={subscribing}>
              {subscribing ? 'Joining...' : 'Join Now'}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default Offers;
