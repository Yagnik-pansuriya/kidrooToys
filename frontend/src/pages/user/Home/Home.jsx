import { useState, useEffect } from 'react';
import { FiArrowRight, FiTruck, FiShield, FiGift, FiRefreshCw } from 'react-icons/fi';
import ProductCard from '../../../components/ProductCard/ProductCard';
import { products } from '../../../mock/products';
import { categories } from '../../../mock/categories';
import { offers } from '../../../mock/offers';
import OfferRenderer from '../../../components/OfferRenderer/OfferRenderer';
import './Home.scss';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [heroSlide, setHeroSlide] = useState(0);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const featuredProducts = products.filter(p => p.featured);
  const newArrivals = products.filter(p => p.newArrival);
  const activeSliderOffer = offers.find(o => o.type === 'slider' && o.active);

  const heroSlides = [
    {
      title: 'Where Imagination Comes to Play! 🎈',
      subtitle: 'Discover the magic of childhood with our curated collection of premium toys',
      cta: 'Shop Now',
      bg: 'var(--color-primary)',
      emoji: '🧸🎮🎨',
    },
    {
      title: 'New STEM Kits Just Arrived! 🔬',
      subtitle: 'Build, code, and explore with our latest educational toys for young minds',
      cta: 'Explore STEM',
      bg: 'var(--color-hover)',
      emoji: '🤖📚🧪',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const features = [
    { icon: <FiTruck />, title: 'Free Shipping', desc: 'On orders over $50' },
    { icon: <FiShield />, title: 'Safe & Secure', desc: 'Child-safe materials' },
    { icon: <FiGift />, title: 'Gift Wrapping', desc: 'Free gift wrap available' },
    { icon: <FiRefreshCw />, title: 'Easy Returns', desc: '30-day return policy' },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
          {heroSlides.map((slide, i) => (
            <div className="hero__slide" key={i} style={{ background: slide.bg }}>
              <div className="container hero__content">
                <div className="hero__text">
                  <h1 className="hero__title">{slide.title}</h1>
                  <p className="hero__subtitle">{slide.subtitle}</p>
                  <button className="hero__cta">
                    {slide.cta} <FiArrowRight />
                  </button>
                </div>
                <div className="hero__emojis">
                  {slide.emoji.split('').filter(c => c.trim()).map((e, j) => (
                    <span key={j} className="hero__emoji" style={{ animationDelay: `${j * 0.2}s` }}>{e === '🧸' || e === '🎮' || e === '🎨' || e === '🤖' || e === '📚' || e === '🧪' ? e : ''}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hero__dots">
          {heroSlides.map((_, i) => (
            <button key={i} className={`hero__dot ${i === heroSlide ? 'hero__dot--active' : ''}`} onClick={() => setHeroSlide(i)} />
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-strip__grid">
            {features.map((f, i) => (
              <div className="features-strip__item" key={i}>
                <span className="features-strip__icon">{f.icon}</span>
                <div>
                  <h4 className="features-strip__title">{f.title}</h4>
                  <p className="features-strip__desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">🎯 Shop by Category</h2>
            <p className="section__subtitle">Find the perfect toy for every interest</p>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-card ${activeCategory === cat.slug ? 'category-card--active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? 'all' : cat.slug)}
              >
                <span className="category-card__icon">{cat.icon}</span>
                <span className="category-card__name">{cat.name}</span>
                <span className="category-card__count">{cat.count} items</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">⭐ Featured Products</h2>
            <p className="section__subtitle">Our most loved toys picked just for you</p>
          </div>
          <div className="products-grid">
            {(activeCategory === 'all' ? featuredProducts : filteredProducts).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Offer Banner */}
      {activeSliderOffer && (
        <section className="section">
          <div className="container">
            <OfferRenderer offer={activeSliderOffer} />
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">✨ New Arrivals</h2>
            <p className="section__subtitle">Fresh picks just landed in our store</p>
          </div>
          <div className="products-grid">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">🎮 All Products</h2>
            <p className="section__subtitle">Browse our complete collection</p>
          </div>
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
