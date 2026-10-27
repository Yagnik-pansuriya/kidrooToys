import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiShoppingCart,
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useGetBannersQuery } from '../../../store/ActionApi/bannerApi';
import { useGetOffersByPageQuery } from '../../../store/ActionApi/offerApi';
import { useCart } from '../../../context/CartContext';
import SEO from '../../../components/SEO/SEO';
import FloatingBuddy from '../../../components/FloatingBuddy/FloatingBuddy';
import { AnimalCanvas, AnimalSpot, shuffleAnimals, callAnimal, callRandomAnimal } from '../../../components/AnimalWorld';
import { playPopSound } from '../../../utils/animalSounds';
import { cdnImage, warmAnimalAssets, warmAssets } from '../../../utils/assetCache';
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

  // ── Refs for smooth scroll ─────────────────────────────────────
  const themeSectionRef = useRef(null);

  const scrollToThemes = () => {
    themeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── 3D animals: a fresh random line-up on every visit ──────────
  const [cast] = useState(shuffleAnimals);

  // ── Asset cache: download every animal and the images further down the
  //    page while the browser is idle, so they're ready before the user scrolls
  useEffect(() => {
    warmAnimalAssets();
  }, []);

  useEffect(() => {
    warmAssets([
      ...categoryList.map((c) => cdnImage(c.image || c.catagoryImage, 600)),
      ...allHomeOffers.map((o) => cdnImage(o.images?.[0]?.url || o.images?.[0], 800)),
      ...newArrivalList.slice(0, 8).map((p) => cdnImage(Array.isArray(p.images) ? p.images[0] : p.image, 500)),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryList.length, newArrivalList.length, allHomeOffers.length]);

  // ── Scroll Reveal Intersection Observer ────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [categoryList.length, newArrivalList.length, allHomeOffers.length]);

  const { addToCart } = useCart();


  // ── Handle Add to Cart with cheerful audio feedback ───────────
  const handleAddToCart = (product) => {
    playPopSound();
    addToCart(product);
  };

  // ── Trust & Milestone badges ──────────────────────────────────
  const trustFeatures = [
    {
      icon: '🌿',
      title: '100% Eco-Safe & Non-Toxic',
      desc: 'Crafted from sustainable beechwood & water-based non-toxic food-grade dyes.',
    },
    {
      icon: '🧠',
      title: 'STEM & Montessori Approved',
      desc: 'Tested by educators to boost motor skills, logic, balance, and spatial IQ.',
    },
    {
      icon: '🚀',
      title: 'Free Shipping on ₹1000+',
      desc: 'Superfast safe dispatch with eco-packaging straight to your doorstep.',
    },
    {
      icon: '💖',
      title: '10,000+ Happy Families',
      desc: 'Cherished by little dreamers and parents across India with 4.9★ love.',
    },
  ];

  return (
    <div className="home-v2">
      {/* ── SEO Head ── */}
      <SEO
        title="Kidroo Toys - Buy Baby Rattles, Puzzles & Board Games Online in India"
        description="Shop safe, BIS approved kids toys at Kidroo: BPA-free baby rattle sets, STEM puzzles, family board games & birthday gifts for boys and girls. Delivery across India."
        keywords="kidroo toys, kidroo, baby rattle set, rattles for newborn baby, puzzle toys for kids, board games for kids, kids toys online india, return gifts for kids"
        canonical="/"
        ogImage={heroBanner?.image || ''}
      />

      {/* ── Floating Buddy Mascot & Top Scroll Progress Indicator ── */}
      <FloatingBuddy onScrollToAnimals={callRandomAnimal} />
      <AnimalCanvas />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="hero-v2 has-animal">
        <AnimalSpot animalId={cast[0].id} side="right" top={[64, 68]} hint />
        {/* Whimsical Floating Background Elements */}
        <div className="hero-v2__floating-prop hero-v2__floating-prop--cloud-left" aria-hidden="true">☁️</div>
        <div className="hero-v2__floating-prop hero-v2__floating-prop--cloud-right" aria-hidden="true">☁️</div>
        <div className="hero-v2__floating-prop hero-v2__floating-prop--star" aria-hidden="true">⭐</div>
        <div className="hero-v2__floating-prop hero-v2__floating-prop--balloon" aria-hidden="true">🎈</div>
        <div className="hero-v2__floating-prop hero-v2__floating-prop--block" aria-hidden="true">🧱</div>

        <div className="hero-v2__container">
          {/* Left Hero Content */}
          <div className="hero-v2__content">
            <div className="hero-v2__tags-row">
              <span className="hero-v2__tag">
                {heroBanner?.tag || 'KIDS NEED TOYS'}
              </span>
              <button
                type="button"
                className="hero-v2__animal-pill"
                onClick={callRandomAnimal}
                title="Meet the animals hiding on this page"
              >
                <span>🐾 Find the Animals</span>
                <span className="pill-pulse" />
              </button>
            </div>

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
                'We provide the best quality toys designed to nurture creativity, inspire learning, and create smiles for kids of all ages.'}
            </p>

            <div className="hero-v2__actions">
              <Link
                to={heroBanner?.buttonUrl || '/shop'}
                className="hero-v2__btn hero-v2__btn--primary"
                onClick={() => playPopSound()}
              >
                {heroBanner?.buttonText || 'Shop Now'} <FiArrowRight />
              </Link>
              <button
                type="button"
                className="hero-v2__btn hero-v2__btn--animals"
                onClick={callRandomAnimal}
              >
                🐾 Hear Real Animal Sounds
              </button>
              <button
                type="button"
                className="hero-v2__btn hero-v2__btn--outline"
                onClick={scrollToThemes}
              >
                Explore Categories
              </button>
            </div>

            {/* Mini Trust Highlights under Hero */}
            <div className="hero-v2__highlights">
              <div className="hero-v2__highlight-item">
                <span className="highlight-icon">🚚</span>
                <span>Free Delivery ₹1000+</span>
              </div>
              <div className="hero-v2__highlight-item">
                <span className="highlight-icon">🛡️</span>
                <span>Safe & Certified Non-Toxic</span>
              </div>
              <div className="hero-v2__highlight-item">
                <span className="highlight-icon">⭐</span>
                <span>10,000+ Happy Families</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual with interactive 3D perspective */}
          <div className="hero-v2__visual">
            <div className="hero-v2__img-wrap">
              <img
                src={
                  cdnImage(heroBanner?.image, 960) ||
                  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop'
                }
                alt={heroBanner?.title || 'Hero banner'}
                className="hero-v2__img"
                decoding="async"
              />

              {/* Floating Animal Mascot Badge */}
              <div
                className="hero-v2__mascot-badge"
                onClick={() => callAnimal(cast[0].id)}
                onKeyDown={(e) => e.key === 'Enter' && callAnimal(cast[0].id)}
                role="button"
                tabIndex={0}
                title={`Hear the ${cast[0].name}!`}
              >
                <span className="mascot-badge__emoji">{cast[0].emoji}</span>
                <div className="mascot-badge__text">
                  <strong>Tap Me!</strong>
                  <span>Hear a real {cast[0].name.toLowerCase()}!</span>
                </div>
              </div>

              {/* Floating Toy Badge */}
              <div className="hero-v2__toy-badge">
                <span className="toy-badge__icon">✨</span>
                <span>Montessori Approved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Organic Wave Divider */}
        <div className="hero-v2__wave" aria-hidden="true">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,32 C240,96 480,16 720,64 C960,112 1200,48 1440,80 L1440,120 L0,120 Z"
              fill="#FAF6F0"
            />
          </svg>
        </div>
      </section>
      {/* ═══════════════════ DISCOVERY BY THEME ═══════════════════ */}
      <section className="theme-section scroll-reveal has-animal" ref={themeSectionRef}>
        <AnimalSpot animalId={cast[1].id} top={[1, 5]} />
        <div className="theme-section__container">
          <div className="theme-section__header">
            <span className="theme-section__chip">🎯 Curated Collections</span>
            <h2>
              Discovery by <span className="theme-section__accent">Theme</span>
            </h2>
            <p>Browse our collections based on your child's age, curiosity, and passions</p>
          </div>

          <div className="theme-section__grid">
            {categoryList.map((cat, idx) => {
              const name = cat.catagoryName || cat.name;
              const description = cat.description || '';
              const imgSrc = cat.image || cat.catagoryImage;
              const categoryUrl = cat.slug
                ? `/category/${cat.slug}`
                : `/shop?category=${cat._id || cat.id}`;

              return (
                <Link
                  to={categoryUrl}
                  className="theme-card scroll-reveal"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  key={cat._id || cat.id}
                  onClick={() => playPopSound()}
                >
                  <div className="theme-card__img-wrap">
                    {imgSrc ? (
                      <img src={cdnImage(imgSrc, 600)} alt={name} className="theme-card__img" loading="lazy" decoding="async" />
                    ) : (
                      <div className="theme-card__placeholder">🎯</div>
                    )}
                  </div>
                  <div className="theme-card__overlay">
                    <div className="theme-card__text">
                      <span className="theme-card__name">{name}</span>
                      {description && <p className="theme-card__desc">{description}</p>}
                    </div>
                    <FiArrowRight className="theme-card__arrow" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {/* Curved Wave Divider into Offers / Categories */}
      <div className="section-wave-divider" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            d="M0,0 C360,60 1080,20 1440,70 L1440,80 L0,80 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* ═══════════ HOME OFFERS (sorted by position) ═══════════ */}
      {allHomeOffers.length > 0 && (
        <section className="home-offers-section scroll-reveal has-animal">
          <AnimalSpot animalId={cast[5].id} top={[0, 4]} />
          <div className="home-offers-section__container">
            <div className="home-offers-section__grid">
              {allHomeOffers.map((offer) => {
                const bg = safeColor(offer.styling?.bgColor, '#FF6B35');
                const txt = safeColor(offer.styling?.textColor, '#FFFFFF');
                return (
                  <Link
                    key={offer._id || offer.id}
                    to={offer.targetUrl || '/offers'}
                    className="home-offer-banner"
                    style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: txt }}
                    onClick={() => playPopSound()}
                  >
                    {offer.images?.[0] && (
                      <img
                        src={cdnImage(offer.images[0].url || offer.images[0], 800)}
                        alt={offer.title}
                        className="home-offer-banner__img"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="home-offer-banner__content">
                      <h3>{offer.title}</h3>
                      {offer.subtitle && <p>{offer.subtitle}</p>}
                      <span className="home-offer-banner__cta">
                        Shop Now <FiArrowRight />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}




      {/* ═══════════════════ NEW ARRIVALS ═══════════════════ */}
      <section className="featured-section scroll-reveal has-animal">
        <AnimalSpot animalId={cast[2].id} top={[1, 5]} />
        <AnimalSpot animalId={cast[3].id} top={[88, 91]} />
        <div className="featured-section__container">
          <div className="featured-section__header">
            <span className="featured-section__chip">🚀 Fresh Off The Workshop</span>
            <h2>
              New <span className="featured-section__accent">Arrivals</span>
            </h2>
            <p>Check out our latest toys designed to spark wonder and play</p>
          </div>

          <div className="featured-section__grid">
            {newArrivalList.slice(0, 8).map((product, idx) => {
              const name = product.productName || product.name;
              const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
              const price = Number(product.price || 0);
              const originalPrice = Number(product.originalPrice || 0);
              const discount =
                product.discountPercentage ||
                (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
              const category = (() => {
                if (Array.isArray(product.categories) && product.categories.length > 0) {
                  const first = product.categories[0];
                  return typeof first === 'object' ? first.catagoryName || first.name || '' : '';
                }
                return product.category?.catagoryName || product.category?.name || '';
              })();

              return (
                <div
                  className="product-card-v2 scroll-reveal"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  key={product._id || product.id}
                >
                  {discount > 0 && (
                    <span className="product-card-v2__badge">-{discount}%</span>
                  )}
                  <span className="product-card-v2__badge product-card-v2__badge--new">NEW</span>
                  <div className="product-card-v2__img-wrap">
                    {imgSrc ? (
                      <img src={cdnImage(imgSrc, 500)} alt={name} className="product-card-v2__img" loading="lazy" decoding="async" />
                    ) : (
                      <div className="product-card-v2__img-placeholder">📦</div>
                    )}
                    <div className="product-card-v2__overlay">
                      <button
                        className="product-card-v2__cart-btn"
                        onClick={() => handleAddToCart(product)}
                        title="Add to cart"
                      >
                        <FiShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <Link
                    to={`/product/${product.slug || product._id || product.id}`}
                    className="product-card-v2__info"
                  >
                    {category && <span className="product-card-v2__category">{category}</span>}
                    <h3 className="product-card-v2__name">{name}</h3>
                    <div className="product-card-v2__pricing">
                      <span className="product-card-v2__price">₹{price.toFixed(0)}</span>
                      {originalPrice > price && (
                        <span className="product-card-v2__original">
                          ₹{originalPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {newArrivalList.length > 0 && (
            <div className="featured-section__more">
              <Link to="/shop" className="featured-section__more-btn" onClick={() => playPopSound()}>
                View All Collections <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>


      {/* ═══════════════════ WHY KIDS & PARENTS LOVE KIDROO ═══════════════════ */}
      <section className="why-kidroo-section scroll-reveal has-animal">
        <AnimalSpot animalId={cast[4].id} top={[2, 8]} />
        <div className="why-kidroo-section__container">
          <div className="why-kidroo-section__header">
            <span className="why-kidroo-section__chip">💖 The Kidroo Promise</span>
            <h2>Why Kids & Parents Adore Kidroo</h2>
            <p>Every toy is designed with love, built for safety, and crafted to spark joy</p>
          </div>

          <div className="why-kidroo-section__grid">
            {trustFeatures.map((feat, idx) => (
              <div
                className="why-card scroll-reveal"
                style={{ animationDelay: `${idx * 0.1}s` }}
                key={feat.title}
                onClick={() => playPopSound()}
              >
                <div className="why-card__icon-wrap">
                  <span className="why-card__emoji">{feat.icon}</span>
                </div>
                <h3 className="why-card__title">{feat.title}</h3>
                <p className="why-card__desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
