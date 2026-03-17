import { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiCopy } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { products } from '../../mock/products';
import './OfferRenderer.scss';

const OfferRenderer = ({ offer }) => {
  switch (offer.type) {
    case 'slider':
      return <SliderOffer offer={offer} />;
    case 'fullscreen-poster':
      return <FullscreenPoster offer={offer} />;
    case 'post':
      return <PostOffer offer={offer} />;
    case 'buyable':
      return <BuyableOffer offer={offer} />;
    default:
      return <PostOffer offer={offer} />;
  }
};

// SLIDER OFFER
const SliderOffer = ({ offer }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % offer.images.length);
  }, [offer.images.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + offer.images.length) % offer.images.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="offer-slider">
      <div className="offer-slider__track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {offer.images.map((img, i) => (
          <div className="offer-slider__slide" key={i}>
            <img src={img} alt={`${offer.title} - Slide ${i + 1}`} />
            <div className="offer-slider__content" style={{ background: `linear-gradient(135deg, ${offer.bgColor}dd, ${offer.bgColor}88)` }}>
              <span className="offer-slider__discount">{offer.discount}% OFF</span>
              <h2 className="offer-slider__title" style={{ color: offer.textColor }}>{offer.title}</h2>
              <p className="offer-slider__subtitle" style={{ color: offer.textColor }}>{offer.subtitle}</p>
              {offer.couponCode && (
                <div className="offer-slider__coupon">
                  <span>Use Code: <strong>{offer.couponCode}</strong></span>
                  <button onClick={() => navigator.clipboard.writeText(offer.couponCode)}><FiCopy /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {offer.images.length > 1 && (
        <>
          <button className="offer-slider__arrow offer-slider__arrow--prev" onClick={prevSlide}><FiChevronLeft /></button>
          <button className="offer-slider__arrow offer-slider__arrow--next" onClick={nextSlide}><FiChevronRight /></button>
          <div className="offer-slider__dots">
            {offer.images.map((_, i) => (
              <button key={i} className={`offer-slider__dot ${i === currentSlide ? 'offer-slider__dot--active' : ''}`} onClick={() => setCurrentSlide(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// FULLSCREEN POSTER
const FullscreenPoster = ({ offer }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(offer.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="offer-poster" style={{ backgroundImage: `url(${offer.images[0]})` }}>
      <div className="offer-poster__overlay" style={{ background: `linear-gradient(135deg, ${offer.bgColor}cc, ${offer.bgColor}66)` }}>
        <div className="offer-poster__content">
          <div className="offer-poster__discount-badge">{offer.discount}% OFF</div>
          <h1 className="offer-poster__title" style={{ color: offer.textColor }}>{offer.title}</h1>
          <p className="offer-poster__subtitle" style={{ color: offer.textColor }}>{offer.subtitle}</p>
          <p className="offer-poster__desc" style={{ color: `${offer.textColor}cc` }}>{offer.description}</p>
          {offer.couponCode && (
            <button className="offer-poster__coupon-btn" onClick={copyCode}>
              {copied ? '✓ Copied!' : `Use Code: ${offer.couponCode}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// POST OFFER
const PostOffer = ({ offer }) => (
  <div className="offer-post">
    <div className="offer-post__image-wrap">
      <img src={offer.images[0]} alt={offer.title} />
      {offer.discount > 0 && (
        <span className="offer-post__discount">{offer.discount}% OFF</span>
      )}
    </div>
    <div className="offer-post__content" style={{ borderLeft: `4px solid ${offer.bgColor}` }}>
      <h3 className="offer-post__title">{offer.title}</h3>
      <p className="offer-post__subtitle">{offer.subtitle}</p>
      <p className="offer-post__desc">{offer.description}</p>
      <div className="offer-post__meta">
        {offer.couponCode && (
          <span className="offer-post__coupon" style={{ background: `${offer.bgColor}20`, color: offer.bgColor }}>
            Code: {offer.couponCode}
          </span>
        )}
        <span className="offer-post__valid">Valid until: {new Date(offer.validUntil).toLocaleDateString()}</span>
      </div>
    </div>
  </div>
);

// BUYABLE OFFER
const BuyableOffer = ({ offer }) => {
  const { addToCart } = useCart();
  const product = products.find(p => p.id === offer.productId);

  if (!product) return null;

  return (
    <div className="offer-buyable" style={{ background: `linear-gradient(135deg, ${offer.bgColor}15, ${offer.bgColor}05)`, border: `2px solid ${offer.bgColor}30` }}>
      <div className="offer-buyable__image">
        <img src={product.image} alt={product.name} />
        <span className="offer-buyable__badge" style={{ background: offer.bgColor }}>{offer.discount}% OFF</span>
      </div>
      <div className="offer-buyable__content">
        <span className="offer-buyable__flash" style={{ color: offer.bgColor }}>⚡ Flash Deal</span>
        <h3 className="offer-buyable__title">{offer.title}</h3>
        <p className="offer-buyable__desc">{offer.description}</p>
        <div className="offer-buyable__pricing">
          <span className="offer-buyable__price">${offer.specialPrice || product.price}</span>
          {product.originalPrice && <span className="offer-buyable__original">${product.originalPrice}</span>}
        </div>
        <button className="offer-buyable__btn" style={{ background: offer.bgColor }} onClick={() => addToCart(product)}>
          <FiShoppingCart /> Add to Cart
        </button>
        {offer.couponCode && (
          <span className="offer-buyable__coupon">
            Extra off with code: <strong>{offer.couponCode}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default OfferRenderer;
