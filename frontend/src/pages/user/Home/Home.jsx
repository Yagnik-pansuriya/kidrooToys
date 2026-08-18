import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiStar, FiCheck, FiShoppingCart } from 'react-icons/fi';
import { useSelector } from 'react-redux';

import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useSubscribeMutation } from '../../../store/ActionApi/newsletterApi';
import { useGetBannersQuery } from '../../../store/ActionApi/bannerApi';
import { useGetOffersByPageQuery } from '../../../store/ActionApi/offerApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import SEO from '../../../components/SEO/SEO';
import './Home.scss';

const Home = () => {
  // ── API data ──────────────────────────────────────────────────
  useGetCategoriesQuery();
  const { data: newArrivalResp } = useGetProductsQuery({ page: 1, limit: 8, newArrival: 'true', isActive: 'true' });
  const { data: bannerResp } = useGetBannersQuery({ activeOnly: true });
  const { data: homeOffersResp } = useGetOffersByPageQuery('home');

  const categories = useSelector((s) => s.category.categories) || [];
  const allCategories = Array.isArray(categories) ? categories : categories?.data || [];
  const categoryList = allCategories.filter((c) => c.isActive !== false);

  // Parse new arrival products from RTK Query response directly
  const newArrivalInner = newArrivalResp?.data || newArrivalResp;
  const newArrivalList = Array.isArray(newArrivalInner?.data) ? newArrivalInner.data
    : Array.isArray(newArrivalInner) ? newArrivalInner : [];

  // Parse banners from API response
  const bannersRaw = bannerResp?.data || bannerResp || [];
  const bannerList = Array.isArray(bannersRaw) ? bannersRaw : [];
  const heroBanner = bannerList[0] || null;

  // Parse home page offers — sorted by position
  const homeOffers = (homeOffersResp?.data || homeOffersResp || []);
  const allHomeOffers = Array.isArray(homeOffers)
    ? [...homeOffers].sort((a, b) => (a.placement?.position || 0) - (b.placement?.position || 0))
    : [];

  // Safe color helper
  const safeColor = (c, fallback) => /^#[0-9A-Fa-f]{3,6}$/.test(c) ? c : fallback;

  // ── Ref for smooth scroll ─────────────────────────────────────
  const themeSectionRef = useRef(null);
  const scrollToThemes = () => {
    themeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Newsletter ────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const { showSuccess, showError } = useToast();
  const { addToCart } = useCart();
  const { requireAuth } = useCustomerAuth();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!requireAuth('Please login to subscribe to our newsletter')) return;
    if (!email.trim()) return;
    try {
      await subscribe(email.trim()).unwrap();
      showSuccess('🎉 Welcome to the Kidroo family!');
      setEmail('');
    } catch (err) {
      showError(err?.data?.message || 'Subscription failed');
    }
  };

  // ── Trust badges ──────────────────────────────────────────────
  const trustBadges = [
    { icon: <FiTruck />, text: 'Free Shipping on ₹500+' },
    { icon: <FiShield />, text: 'Safe & Non-Toxic Materials' },
    { icon: <FiStar />, text: '10,000+ Happy Families' },
  ];

  return (
    <div className="home-v2">
      {/* ── SEO Head ── */}
      <SEO
        title="Premium Kids Toys - Educational & Fun"
        description="Kidroo Toys - Where Imagination Comes to Play! Shop premium quality toys, educational kits, action figures, building blocks, and more for kids of all ages. Free shipping on orders over ₹500."
        keywords="kidroo toys, kids toys online, educational toys, wooden toys, baby toys, toys for children, buy toys online India, montessori toys, building blocks, action figures"
        canonical={window.location.origin}
        ogImage={heroBanner?.image || ''}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Kidroo Toys',
            url: window.location.origin,
            logo: `${window.location.origin}/favicon.svg`,
            description: 'Premium quality toys for kids - educational, safe, and fun. Where imagination comes to play!',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              availableLanguage: ['English', 'Hindi'],
            },
            sameAs: [],
          },
          ...(categoryList.length > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'ItemList',
                  name: 'Toy Categories',
                  description: 'Browse our toy categories',
                  numberOfItems: categoryList.length,
                  itemListElement: categoryList.map((cat, index) => {
                    const name = cat.catagoryName || cat.name;
                    const catUrl = cat.slug
                      ? `${window.location.origin}/category/${cat.slug}`
                      : `${window.location.origin}/shop?category=${cat._id || cat.id}`;
                    return {
                      '@type': 'ListItem',
                      position: index + 1,
                      name: name,
                      url: catUrl,
                      ...(cat.image && { image: cat.image }),
                    };
                  }),
                },
              ]
            : []),
        ]}
      />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="hero-v2">
        <div className="hero-v2__container">
          <div className="hero-v2__content">
            <span className="hero-v2__tag">
              {heroBanner?.tag || 'KIDS NEED TOYS'}
            </span>
            <h1 className="hero-v2__title">
              {heroBanner?.title || 'Toys That'}{' '}
              <span className="hero-v2__accent">
                {heroBanner?.highlightText || 'Spark'}
              </span>
              <br />
              <span className="hero-v2__italic">
                {heroBanner?.italicText || 'Joy'}
              </span>{' '}
              {heroBanner?.afterText || '& Imagination'}
            </h1>
            <p className="hero-v2__desc">
              {heroBanner?.description ||
                'We provide the best quality toys designed to nurture creativity, inspire learning, and create smiles for kids.'}
            </p>
            <div className="hero-v2__actions">
              <Link
                to={heroBanner?.buttonUrl || '/shop'}
                className="hero-v2__btn hero-v2__btn--primary"
              >
                {heroBanner?.buttonText || 'Shop Now'} <FiArrowRight />
              </Link>
              <button
                type="button"
                className="hero-v2__btn hero-v2__btn--outline"
                onClick={scrollToThemes}
              >
                Explore Categories
              </button>
            </div>
          </div>
          <div className="hero-v2__visual">
            <div className="hero-v2__img-wrap">
              <img
                src={
                  heroBanner?.image ||
                  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop'
                }
                alt={heroBanner?.title || 'Hero banner'}
                className="hero-v2__img"
              />
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="hero-v2__trust">
          {trustBadges.map((badge, i) => (
            <div className="hero-v2__trust-item" key={i}>
              {badge.icon}
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOME OFFERS (sorted by position) ═══════════ */}
      {allHomeOffers.length > 0 && (
        <section className="home-offers-section">
          <div className="home-offers-section__container">
            <div className="home-offers-section__grid">
              {allHomeOffers.map(offer => {
                const bg = safeColor(offer.styling?.bgColor, '#FF6B35');
                const txt = safeColor(offer.styling?.textColor, '#FFFFFF');
                return (
                  <Link key={offer._id || offer.id} to={offer.targetUrl || '/offers'}
                    className="home-offer-banner"
                    style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: txt }}>
                    {offer.images?.[0] && (
                      <img src={offer.images[0].url || offer.images[0]} alt={offer.title} className="home-offer-banner__img" />
                    )}
                    <div className="home-offer-banner__content">
                      <h3>{offer.title}</h3>
                      {offer.subtitle && <p>{offer.subtitle}</p>}
                      <span className="home-offer-banner__cta">Shop Now <FiArrowRight /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ DISCOVERY BY THEME ═══════════════════ */}
      <section className="theme-section" ref={themeSectionRef}>
        <div className="theme-section__container">
          <div className="theme-section__header">
            <h2>Discovery by <span className="theme-section__accent">Theme</span></h2>
            <p>Browse our collections based on your child's interests and passions</p>
          </div>
          <div className="theme-section__grid">
            {categoryList.map((cat) => {
              const name = cat.catagoryName || cat.name;
              const description = cat.description || '';
              const imgSrc = cat.image || cat.catagoryImage;
              const categoryUrl = cat.slug
                ? `/category/${cat.slug}`
                : `/shop?category=${cat._id || cat.id}`;
              return (
                <Link
                  to={categoryUrl}
                  className="theme-card"
                  key={cat._id || cat.id}
                >
                  <div className="theme-card__img-wrap">
                    {imgSrc ? (
                      <img src={imgSrc} alt={name} className="theme-card__img" loading="lazy" />
                    ) : (
                      <div className="theme-card__placeholder">🎯</div>
                    )}
                  </div>
                  <div className="theme-card__overlay">
                    <div className="theme-card__text">
                      <span className="theme-card__name">{name}</span>
                      {description && (
                        <p className="theme-card__desc">{description}</p>
                      )}
                    </div>
                    <FiArrowRight className="theme-card__arrow" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>



      {/* ═══════════════════ NEW ARRIVALS ═══════════════════ */}
      <section className="featured-section">
        <div className="featured-section__container">
          <div className="featured-section__header">
            <h2>New <span className="featured-section__accent">Arrivals</span></h2>
            <p>Check out our latest additions to the toy collection</p>
          </div>
          <div className="featured-section__grid">
            {newArrivalList.slice(0, 8).map((product) => {
              const name = product.productName || product.name;
              const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
              const price = Number(product.price || 0);
              const originalPrice = Number(product.originalPrice || 0);
              const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
              const category = (() => {
                if (Array.isArray(product.categories) && product.categories.length > 0) {
                  const first = product.categories[0];
                  return typeof first === 'object' ? (first.catagoryName || first.name || '') : '';
                }
                return product.category?.catagoryName || product.category?.name || '';
              })();

              return (
                <div className="product-card-v2" key={product._id || product.id}>
                  {discount > 0 && (
                    <span className="product-card-v2__badge">-{discount}%</span>
                  )}
                  <span className="product-card-v2__badge product-card-v2__badge--new">NEW</span>
                  <div className="product-card-v2__img-wrap">
                    {imgSrc ? (
                      <img src={imgSrc} alt={name} className="product-card-v2__img" loading="lazy" />
                    ) : (
                      <div className="product-card-v2__img-placeholder">📦</div>
                    )}
                    <div className="product-card-v2__overlay">
                      <button
                        className="product-card-v2__cart-btn"
                        onClick={() => addToCart(product)}
                        title="Add to cart"
                      >
                        <FiShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <Link to={`/product/${product.slug || product._id || product.id}`} className="product-card-v2__info">
                    {category && <span className="product-card-v2__category">{category}</span>}
                    <h3 className="product-card-v2__name">{name}</h3>
                    <div className="product-card-v2__pricing">
                      <span className="product-card-v2__price">₹{price.toFixed(0)}</span>
                      {originalPrice > price && (
                        <span className="product-card-v2__original">₹{originalPrice.toFixed(0)}</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          {newArrivalList.length > 0 && (
            <div className="featured-section__more">
              <Link to="/shop" className="featured-section__more-btn">
                View All <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>



      <section className="newsletter-section">
        <div className="newsletter-section__container">
          <div className="newsletter-section__content">
            <h2 className="newsletter-section__title">Join the Kidroo Family</h2>
            <p className="newsletter-section__desc">
              Be the first to know about new arrivals, exciting deals, and kiddo-approved picks. Get 10% off your
              first order!
            </p>
            <form className="newsletter-section__form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-section__input"
              />
              <button
                type="submit"
                className="newsletter-section__btn"
                disabled={subscribing}
              >
                {subscribing ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            <div className="newsletter-section__perks">
              <span><FiCheck /> Free shipping on first order</span>
              <span><FiCheck /> Exclusive member deals</span>
              <span><FiCheck /> Early access to new toys</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
