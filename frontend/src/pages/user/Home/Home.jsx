import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiStar, FiCheck, FiShoppingCart } from 'react-icons/fi';
import { useSelector } from 'react-redux';

import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useSubscribeMutation } from '../../../store/ActionApi/newsletterApi';
import { useGetBannersQuery } from '../../../store/ActionApi/bannerApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import './Home.scss';

const Home = () => {
  // ── API data ──────────────────────────────────────────────────
  useGetCategoriesQuery();
  useGetProductsQuery({ page: 1, limit: 8, featured: 'true' });
  const { data: bannerResp } = useGetBannersQuery({ activeOnly: true });

  const categories = useSelector((s) => s.category.categories) || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.data || [];
  const products = useSelector((s) => s.product.products) || [];
  const productList = Array.isArray(products) ? products : products?.data || [];

  // Parse banners from API response
  const bannersRaw = bannerResp?.data || bannerResp || [];
  const bannerList = Array.isArray(bannersRaw) ? bannersRaw : [];
  const heroBanner = bannerList[0] || null;

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

  // ── Trust badges ──────────────────────────────────────────────
  const trustBadges = [
    { icon: <FiTruck />, text: 'Free Shipping on ₹500+' },
    { icon: <FiShield />, text: 'Safe & Non-Toxic Materials' },
    { icon: <FiStar />, text: '10,000+ Happy Families' },
  ];

  return (
    <div className="home-v2">

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

      {/* ═══════════════════ DISCOVERY BY THEME ═══════════════════ */}
      <section className="theme-section" ref={themeSectionRef}>
        <div className="theme-section__container">
          <div className="theme-section__header">
            <h2>Discovery by <span className="theme-section__accent">Theme</span></h2>
            <p>Browse our collections based on your child's interests and passions</p>
          </div>
          <div className="theme-section__grid">
            {categoryList.slice(0, 4).map((cat) => {
              const name = cat.catagoryName || cat.name;
              const imgSrc = cat.image || cat.catagoryImage;
              return (
                <Link
                  to={`/shop?category=${cat._id || cat.id}`}
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
                    <span className="theme-card__name">{name}</span>
                    <FiArrowRight className="theme-card__arrow" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED FAVORITES ═══════════════════ */}
      <section className="featured-section">
        <div className="featured-section__container">
          <div className="featured-section__header">
            <h2>Featured <span className="featured-section__accent">Favorites</span></h2>
            <p>Our most loved toys picked by parents and kids alike</p>
          </div>
          <div className="featured-section__grid">
            {productList.slice(0, 8).map((product) => {
              const name = product.productName || product.name;
              const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
              const price = Number(product.price || 0);
              const originalPrice = Number(product.originalPrice || 0);
              const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
              const category = product.category?.catagoryName || product.category?.name || '';

              return (
                <div className="product-card-v2" key={product._id || product.id}>
                  {discount > 0 && (
                    <span className="product-card-v2__badge">-{discount}%</span>
                  )}
                  {product.newArrival && (
                    <span className="product-card-v2__badge product-card-v2__badge--new">NEW</span>
                  )}
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
                  <Link to={`/product/${product._id || product.id}`} className="product-card-v2__info">
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
          {productList.length > 0 && (
            <div className="featured-section__more">
              <Link to="/shop" className="featured-section__more-btn">
                View All Products <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ NEWSLETTER ═══════════════════ */}
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
