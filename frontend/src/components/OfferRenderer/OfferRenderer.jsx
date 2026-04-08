import { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiCopy } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
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

// Helper to get images array from offer (backend uses 'image', mock used 'images')
const getImages = (offer) => {
  const imgs = offer.image || offer.images || [];
  return Array.isArray(imgs) ? imgs : [imgs];
};

// SLIDER OFFER
const SliderOffer = ({ offer }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const imgs = getImages(offer);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % imgs.length);
  }, [imgs.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + imgs.length) % imgs.length);
  };

  useEffect(() => {
    if (imgs.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, imgs.length]);

  if (imgs.length === 0) return null;

  return (
    <div className="offer-slider">
      <div className="offer-slider__track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {imgs.map((img, i) => (
          <div className="offer-slider__slide" key={i}>
            <img src={img} alt={`${offer.title} - Slide ${i + 1}`} />
            <div className="offer-slider__content" style={{ background: `linear-gradient(135deg, ${offer.bgColor || '#8B7355'}dd, ${offer.bgColor || '#8B7355'}88)` }}>
              {(offer.discountPercentage || offer.discount) > 0 && (
                <span className="offer-slider__discount">{offer.discountPercentage || offer.discount}% OFF</span>
              )}
              <h2 className="offer-slider__title" style={{ color: offer.textColor || '#fff' }}>{offer.title}</h2>
              <p className="offer-slider__subtitle" style={{ color: offer.textColor || '#fff' }}>{offer.subtitle}</p>
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
      {imgs.length > 1 && (
        <>
          <button className="offer-slider__arrow offer-slider__arrow--prev" onClick={prevSlide}><FiChevronLeft /></button>
          <button className="offer-slider__arrow offer-slider__arrow--next" onClick={nextSlide}><FiChevronRight /></button>
          <div className="offer-slider__dots">
            {imgs.map((_, i) => (
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
  const imgs = getImages(offer);

  const copyCode = () => {
    navigator.clipboard.writeText(offer.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="offer-poster" style={{ backgroundImage: `url(${imgs[0]})` }}>
      <div className="offer-poster__overlay" style={{ background: `linear-gradient(135deg, ${offer.bgColor || '#8B7355'}cc, ${offer.bgColor || '#8B7355'}66)` }}>
        <div className="offer-poster__content">
          {(offer.discountPercentage || offer.discount) > 0 && (
            <div className="offer-poster__discount-badge">{offer.discountPercentage || offer.discount}% OFF</div>
          )}
          <h1 className="offer-poster__title" style={{ color: offer.textColor || '#fff' }}>{offer.title}</h1>
          <p className="offer-poster__subtitle" style={{ color: offer.textColor || '#fff' }}>{offer.subtitle}</p>
          <p className="offer-poster__desc" style={{ color: `${offer.textColor || '#fff'}cc` }}>{offer.description}</p>
          {offer.couponCode && (
            <button className="offer-poster__coupon-btn" onClick={copyCode}>
              {copied ? '✓ Copied!' : `Use Code: ${offer.couponCode}`}
            </button>
          )}
          {offer.targetUrl && (
            <a href={offer.targetUrl} className="offer-poster__shop-btn" target="_blank" rel="noopener noreferrer">
              Shop Now →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// POST OFFER
const PostOffer = ({ offer }) => {
  const imgs = getImages(offer);

  return (
    <div className="offer-post">
      <div className="offer-post__image-wrap">
        {imgs[0] && <img src={imgs[0]} alt={offer.title} />}
        {(offer.discountPercentage || offer.discount) > 0 && (
          <span className="offer-post__discount">{offer.discountPercentage || offer.discount}% OFF</span>
        )}
      </div>
      <div className="offer-post__content" style={{ borderLeft: `4px solid ${offer.bgColor || '#8B7355'}` }}>
        <h3 className="offer-post__title">{offer.title}</h3>
        <p className="offer-post__subtitle">{offer.subtitle}</p>
        <p className="offer-post__desc">{offer.description}</p>
        <div className="offer-post__meta">
          {offer.couponCode && (
            <span className="offer-post__coupon" style={{ background: `${offer.bgColor || '#8B7355'}20`, color: offer.bgColor || '#8B7355' }}>
              Code: {offer.couponCode}
            </span>
          )}
          {(offer.validity?.to || offer.validUntil) && (
            <span className="offer-post__valid">Valid until: {new Date(offer.validity?.to || offer.validUntil).toLocaleDateString()}</span>
          )}
        </div>
        {offer.targetUrl && (
          <a href={offer.targetUrl} className="offer-post__shop-link">
            Shop Now →
          </a>
        )}
      </div>
    </div>
  );
};

// BUYABLE OFFER
const BuyableOffer = ({ offer }) => {
  const { addToCart } = useCart();
  const imgs = getImages(offer);

  return (
    <div className="offer-buyable" style={{ background: `linear-gradient(135deg, ${offer.bgColor || '#8B7355'}15, ${offer.bgColor || '#8B7355'}05)`, border: `2px solid ${offer.bgColor || '#8B7355'}30` }}>
      <div className="offer-buyable__image">
        {imgs[0] && <img src={imgs[0]} alt={offer.title} />}
        {(offer.discountPercentage || offer.discount) > 0 && (
          <span className="offer-buyable__badge" style={{ background: offer.bgColor || '#8B7355' }}>{offer.discountPercentage || offer.discount}% OFF</span>
        )}
      </div>
      <div className="offer-buyable__content">
        <span className="offer-buyable__flash" style={{ color: offer.bgColor || '#8B7355' }}>⚡ Flash Deal</span>
        <h3 className="offer-buyable__title">{offer.title}</h3>
        <p className="offer-buyable__desc">{offer.description}</p>
        {offer.couponCode && (
          <span className="offer-buyable__coupon">
            Use code: <strong>{offer.couponCode}</strong>
          </span>
        )}
        {offer.targetUrl && (
          <a href={offer.targetUrl} className="offer-buyable__btn" style={{ background: offer.bgColor || '#8B7355' }}>
            <FiShoppingCart /> Shop Now
          </a>
        )}
      </div>
    </div>
  );
};

export default OfferRenderer;
