import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiTruck, FiRefreshCw, FiShoppingCart, FiMinus, FiPlus, FiChevronRight, FiChevronLeft, FiShield, FiPackage, FiPlay, FiHeart, FiZap } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useGetProductByIdQuery } from '../../../store/ActionApi/productApi';
import { useGetVariantsQuery } from '../../../store/ActionApi/variantApi';
import { useGetProductReviewsQuery, useGetProductReviewStatsQuery, useAddReviewMutation } from '../../../store/ActionApi/reviewApi';
import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useToggleWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { toggleWishlistId } from '../../../store/ReducerApi/customerAuthSlice';
import Loader from '../../../components/Loader/Loader';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  const { requireAuth, isCustomerAuthenticated, isInWishlist, customer } = useCustomerAuth();
  const [toggleWishlistApi] = useToggleWishlistMutation();

  // ── API data ──────────────────────────────────────────────────
  const { data: productResp, isLoading } = useGetProductByIdQuery(id);
  const { data: variantsResp, isLoading: isVariantsLoading } = useGetVariantsQuery(id, {
    refetchOnMountOrArgChange: true,
  });

  const { data: reviewsResp } = useGetProductReviewsQuery(id);
  const { data: statsResp } = useGetProductReviewStatsQuery(id);
  const [addReviewApi, { isLoading: submittingReview }] = useAddReviewMutation();


  const product = productResp?.data || productResp;

  // Safely unwrap the variants response — API returns { success, data: [...] }
  const rawVariants = variantsResp?.data ?? variantsResp;
  const variants = Array.isArray(rawVariants) ? rawVariants : [];

  const reviews = reviewsResp?.data || reviewsResp || [];
  const stats = statsResp?.data || statsResp || {};

  // Resolve categories array (new multi-category schema)
  const productCategories = useMemo(() => {
    if (Array.isArray(product?.categories) && product.categories.length > 0) {
      return product.categories.map((c) => ({
        id: typeof c === 'object' ? (c._id || c.id) : c,
        name: typeof c === 'object' ? (c.catagoryName || c.name || '') : '',
      }));
    }
    // Legacy fallback
    if (product?.category) {
      const id = typeof product.category === 'object'
        ? (product.category._id || product.category.id)
        : product.category;
      const name = typeof product.category === 'object'
        ? (product.category.catagoryName || product.category.name || '')
        : '';
      return id ? [{ id, name }] : [];
    }
    return [];
  }, [product]);

  // Use first category for related products query
  const primaryCategoryId = productCategories[0]?.id || '';
  const { data: relatedResp } = useGetProductsQuery(
    { page: 1, limit: 4, category: primaryCategoryId },
    { skip: !primaryCategoryId }
  );
  const relatedInner = relatedResp?.data || relatedResp;
  const relatedProducts = (relatedInner?.data || relatedInner || [])
    .filter((p) => (p._id || p.id) !== id);

  // ── Variant helpers ───────────────────────────────────────────
  const variantList = useMemo(() => {
    const list = Array.isArray(variants) ? variants : [];
    return list.filter((v) => v.status !== 'inactive');
  }, [variants]);

  // Extract all unique attribute keys (e.g. ["Color", "Size"])
  // Handle both plain objects and potential legacy Map-serialized formats
  const attrKeys = useMemo(() => {
    const keys = variantList.flatMap((v) => {
      const attrs = v.attributes;
      if (!attrs || typeof attrs !== 'object') return [];
      return Object.keys(attrs);
    });
    return [...new Set(keys)];
  }, [variantList]);

  // ── Local state ───────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  // Track each attribute selection independently: { Color: 'Red', Size: 'Large' }
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [activeTab, setActiveTab] = useState('description');

  // Review form
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', comment: '' });

  // ── Auto-select default variant on load ───────────────────────
  useEffect(() => {
    if (variantList.length === 0) return;

    const defaultVariant = variantList.find((v) => v.isDefault) || variantList[0];
    if (defaultVariant) {
      setSelectedVariant(defaultVariant);
      // Populate selectedAttrs from the default variant's attributes
      const attrs = {};
      if (defaultVariant.attributes) {
        Object.entries(defaultVariant.attributes).forEach(([key, val]) => {
          attrs[key] = val;
        });
      }
      setSelectedAttrs(attrs);
    }
  }, [variantList]);

  // ── When selectedAttrs changes, find the matching variant ─────
  useEffect(() => {
    if (attrKeys.length === 0) return;

    // Score each variant: count how many selected attributes it matches.
    // The best (highest score) variant wins. This handles both full matches
    // (all keys shared) and partial matches (variants with different key sets).
    let bestVariant = null;
    let bestScore = -1;

    for (const v of variantList) {
      let score = 0;
      const vAttrs = v.attributes || {};
      for (const [key, val] of Object.entries(selectedAttrs)) {
        if (vAttrs[key] === val) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestVariant = v;
      }
    }

    setSelectedVariant(bestVariant || null);
    setSelectedImage(0);
  }, [selectedAttrs, variantList, attrKeys]);

  // ── Determine which attribute values are clickable given current selections ──
  //
  // A value is "available" if there exists at least one variant that:
  //   (a) has this attribute key = this value, AND
  //   (b) for every OTHER selected attribute, either matches it OR simply
  //       doesn't have that key at all (it's a different variant type).
  const getAvailableValues = (attrKey) => {
    return variantList
      .filter((v) => {
        const vAttrs = v.attributes || {};
        for (const [key, val] of Object.entries(selectedAttrs)) {
          if (key === attrKey) continue;          // skip the key we're evaluating
          if (!(key in vAttrs)) continue;          // variant doesn't have this key — OK
          if (vAttrs[key] !== val) return false;   // has the key but different value — incompatible
        }
        return true;
      })
      .map((v) => (v.attributes || {})[attrKey])
      .filter(Boolean);
  };

  if (isLoading) return <Loader message="Loading product…" />;
  if (!product) return <div className="pdp-empty">Product not found.</div>;

  const name = product.productName || product.name;

  // Use variant images if variant has them, otherwise fall back to product images
  const productImages = product.images?.length ? product.images : [product.image].filter(Boolean);
  const variantImages = selectedVariant?.images?.length ? selectedVariant.images : [];
  const images = variantImages.length > 0 ? variantImages : productImages;

  // YouTube embed helper
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    // Handle youtu.be short links
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // Handle youtube.com/shorts/
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    // Handle youtube.com/watch?v=
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
    // Handle youtube.com/embed/
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    return null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(selectedVariant?.youtubeUrl || product.youtubeUrl);
  const totalSlides = images.length + (youtubeEmbedUrl ? 1 : 0);
  const isVideoSlide = youtubeEmbedUrl && selectedImage === images.length;

  const handlePrevSlide = () => setSelectedImage((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  const handleNextSlide = () => setSelectedImage((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));

  const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price || 0);
  const originalPrice = selectedVariant ? Number(selectedVariant.originalPrice || 0) : Number(product.originalPrice || 0);
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : (product.discountPercentage || 0);
  const categoryName = productCategories.map((c) => c.name).filter(Boolean).join(', ');
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = stock > 0;
  const sku = selectedVariant?.sku || '';

  const handleSelectAttr = (key, val) => {
    // Step 1: try to keep all existing selections + this new one
    const merged = { ...selectedAttrs, [key]: val };

    // Check if any variant matches all of merged
    const exactMatch = variantList.find((v) => {
      const vAttrs = v.attributes || {};
      return Object.entries(merged).every(([k, v_]) => vAttrs[k] === v_);
    });

    if (exactMatch) {
      // Perfect combo match — keep all current selections
      setSelectedAttrs(merged);
    } else {
      // No exact match: find the best variant that has [key]=val
      // and adopt its full attributes (clears incompatible selections)
      const best = variantList.find((v) => (v.attributes || {})[key] === val);
      if (best) {
        setSelectedAttrs({ ...best.attributes });
      } else {
        setSelectedAttrs({ [key]: val });
      }
    }
  };


  const handleAddToCart = () => {
    addToCart({ ...product, quantity, selectedVariant });
    showSuccess(`${name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (!requireAuth('Please login to purchase this product')) return;
    addToCart({ ...product, quantity, selectedVariant });
    showSuccess(`${name} added to cart!`);
    // Navigate to cart/checkout
    window.location.href = '/cart';
  };

  const handleToggleWishlist = async () => {
    if (!requireAuth('Please login to save items to your wishlist')) return;
    try {
      await toggleWishlistApi(id).unwrap();
      dispatch(toggleWishlistId(id));
      showSuccess(isInWishlist(id) ? 'Removed from wishlist' : 'Added to wishlist ❤️');
    } catch (err) {
      showError('Failed to update wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth('Please login to write a review')) return;
    try {
      const body = { ...reviewForm };
      // Auto-fill name from customer profile if available
      if (customer && !body.name) {
        body.name = `${customer.firstName} ${customer.lastName}`;
      }
      await addReviewApi({ productId: id, body }).unwrap();
      showSuccess('Review added successfully!');
      setReviewForm({ name: '', rating: 5, title: '', comment: '' });
    } catch (err) {
      showError(err?.data?.message || 'Failed to add review');
    }
  };

  return (
    <div className="pdp">
      {/* ── Breadcrumb ── */}
      <nav className="pdp__breadcrumb">
        <Link to="/">Home</Link>
        <FiChevronRight />
        {productCategories.length > 0 && (
          <>
            <Link to={`/?category=${productCategories[0].id}`}>
              {productCategories[0].name || 'Shop'}
            </Link>
            <FiChevronRight />
          </>
        )}
        <span>{name}</span>
      </nav>

      {/* ═══════════ PRODUCT MAIN ═══════════ */}
      <section className="pdp__main">
        {/* Image slider gallery */}
        <div className="pdp__gallery">
          <div className="pdp__slider">
            {/* Main display area */}
            <div className="pdp__main-image">
              {isVideoSlide ? (
                <div className="pdp__video-wrap">
                  <iframe
                    src={youtubeEmbedUrl}
                    title="Product Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="pdp__video-iframe"
                  />
                </div>
              ) : images[selectedImage] ? (
                <img src={images[selectedImage]} alt={name} />
              ) : (
                <div className="pdp__img-placeholder">📦</div>
              )}
              {discount > 0 && !isVideoSlide && <span className="pdp__badge">-{discount}%</span>}
            </div>

            {/* Slider arrows */}
            {totalSlides > 1 && (
              <>
                <button className="pdp__slider-arrow pdp__slider-arrow--prev" onClick={handlePrevSlide} aria-label="Previous slide">
                  <FiChevronLeft />
                </button>
                <button className="pdp__slider-arrow pdp__slider-arrow--next" onClick={handleNextSlide} aria-label="Next slide">
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Slide counter */}
            {totalSlides > 1 && (
              <div className="pdp__slide-counter">
                {selectedImage + 1} / {totalSlides}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {totalSlides > 1 && (
            <div className="pdp__thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`pdp__thumb ${i === selectedImage ? 'pdp__thumb--active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${name} ${i + 1}`} />
                </button>
              ))}
              {youtubeEmbedUrl && (
                <button
                  className={`pdp__thumb pdp__thumb--video ${selectedImage === images.length ? 'pdp__thumb--active' : ''}`}
                  onClick={() => setSelectedImage(images.length)}
                >
                  <FiPlay className="pdp__thumb-play" />
                  <span>Video</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="pdp__info">
          <h1 className="pdp__name">{name}</h1>

          {/* Rating */}
          <div className="pdp__rating">
            <span className="pdp__rating-badge">
              <FiStar /> {product.ratings || 0}
            </span>
            <span className="pdp__reviews-count">{product.numReviews || 0} reviews</span>
          </div>

          {/* Price */}
          <div className="pdp__pricing">
            <span className="pdp__price">₹{price.toFixed(2)}</span>
            {originalPrice > price && (
              <span className="pdp__original">₹{originalPrice.toFixed(2)}</span>
            )}
            {discount > 0 && <span className="pdp__discount-tag">{discount}% OFF</span>}
          </div>

          <p className="pdp__desc">{product.description}</p>

          {/* Categories */}
          {productCategories.length > 0 && (
            <div className="pdp__option-group">
              <label>Categories</label>
              <div className="pdp__category-tags">
                {productCategories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shop?category=${c.id}`}
                    className="pdp__category-tag"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Age Range */}
          {product.ageRange && (
            <div className="pdp__option-group">
              <label>Age Range</label>
              <span className="pdp__age-tag">
                {product.ageRange.from}–{product.ageRange.to} years
              </span>
            </div>
          )}

          {/* ── Skills ── */}
          {Array.isArray(product.skills) && product.skills.length > 0 && (
            <div className="pdp__skills">
              <label className="pdp__skills-label">
                <FiZap /> Skills Developed
              </label>
              <div className="pdp__skills-grid">
                {product.skills.map((skill) => {
                  const sid = skill._id || skill.id || skill;
                  const sName = skill.name || '';
                  const sDesc = skill.description || '';
                  const sImg = skill.image || '';
                  return (
                    <div key={sid} className="pdp__skill-card">
                      {sImg && (
                        <div className="pdp__skill-img">
                          <img src={sImg} alt={sName} loading="lazy" />
                        </div>
                      )}
                      <div className="pdp__skill-info">
                        <strong>{sName}</strong>
                        {sDesc && <span>{sDesc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Variant selectors (multi-attribute) ── */}
          {isVariantsLoading ? (
            <div className="pdp__variants-loading">
              <div className="pdp__variants-skeleton" />
            </div>
          ) : variantList.length > 0 ? (
            attrKeys.length > 0 ? attrKeys.map((key) => {
              const allValues = [...new Set(variantList.map((v) => v.attributes?.[key]).filter(Boolean))];
              const availableValues = getAvailableValues(key);
              return (
                <div className="pdp__option-group" key={key}>
                  <label>
                    {key}
                    {selectedAttrs[key] && (
                      <span className="pdp__option-selected">: {selectedAttrs[key]}</span>
                    )}
                  </label>
                  <div className="pdp__option-pills">
                    {allValues.map((val) => {
                      const isSelected = selectedAttrs[key] === val;
                      const isAvailable = availableValues.includes(val);
                      return (
                        <button
                          key={val}
                          className={`pdp__pill ${isSelected ? 'pdp__pill--active' : ''} ${!isAvailable ? 'pdp__pill--disabled' : ''}`}
                          onClick={() => isAvailable && handleSelectAttr(key, val)}
                          disabled={!isAvailable}
                          title={!isAvailable ? 'This combination is unavailable' : ''}
                        >
                          {key.toLowerCase() === 'color' ? (
                            <span className="pdp__color-dot" style={{ background: val }} />
                          ) : null}
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div className="pdp__option-group">
                <p className="pdp__no-attrs">This product has {variantList.length} variant(s) available.</p>
              </div>
            )
          ) : null}

          {/* Variant meta: SKU & Stock indicator */}
          {selectedVariant && (
            <div className="pdp__variant-meta">
              {sku && (
                <span className="pdp__sku">
                  <FiPackage /> SKU: {sku}
                </span>
              )}
              <span className={`pdp__stock-indicator ${inStock ? 'pdp__stock-indicator--in' : 'pdp__stock-indicator--out'}`}>
                {inStock ? (
                  stock <= 5 ? `Only ${stock} left!` : 'In Stock'
                ) : 'Out of Stock'}
              </span>
            </div>
          )}


          {/* Quantity */}
          <div className="pdp__option-group">
            <label>Quantity</label>
            <div className="pdp__qty">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}><FiPlus /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="pdp__actions">
            <button className="pdp__add-btn" onClick={handleAddToCart} disabled={!inStock}>
              <FiShoppingCart /> {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button className="pdp__buy-btn" onClick={handleBuyNow} disabled={!inStock}>
              Buy Now
            </button>
            <button
              className={`pdp__wishlist-btn ${isInWishlist(id) ? 'pdp__wishlist-btn--active' : ''}`}
              onClick={handleToggleWishlist}
              title={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart />
            </button>
          </div>

          {/* Warranty & Guarantee badges */}
          {(product.hasWarranty || product.hasGuarantee) && (
            <div className="pdp__warranty-badges">
              {product.hasWarranty && (
                <div className="pdp__warranty-badge">
                  <FiShield className="pdp__warranty-icon" />
                  <div>
                    <strong>{product.warrantyPeriod ? `${product.warrantyPeriod} Month` : ''} Warranty</strong>
                    {product.warrantyType && (
                      <small>{product.warrantyType === 'manufacturer' ? 'Manufacturer' : 'Seller'} Warranty</small>
                    )}
                  </div>
                </div>
              )}
              {product.hasGuarantee && (
                <div className="pdp__warranty-badge">
                  <FiShield className="pdp__warranty-icon" />
                  <div>
                    <strong>{product.guaranteePeriod ? `${product.guaranteePeriod} Month` : ''} Guarantee</strong>
                    {product.guaranteeTerms && (
                      <small>{product.guaranteeTerms}</small>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="pdp__trust">
            <span><FiTruck /> Free Shipping</span>
            <span><FiRefreshCw /> 30-Day Returns</span>
            <span><FiShield /> Secure Payment</span>
          </div>
        </div>
      </section>

      {/* ═══════════ TABS ═══════════ */}
      <section className="pdp__tabs-section">
        <div className="pdp__tab-nav">
          <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>
            Description
          </button>
          <button className={activeTab === 'specs' ? 'active' : ''} onClick={() => setActiveTab('specs')}>
            Specifications
          </button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
            Reviews ({reviews.length})
          </button>
        </div>

        <div className="pdp__tab-content">
          {activeTab === 'description' && (
            <div className="pdp__tab-desc">
              <h3>Designed for Little Hands, Built for Big Dreams</h3>
              <p>{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="pdp__tags">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="pdp__tag">✓ {tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="pdp__tab-specs">
              <table>
                <tbody>
                  <tr><td>Brand</td><td>Kidroo</td></tr>
                  <tr><td>Categories</td><td>{categoryName || 'Uncategorized'}</td></tr>
                  {product.hasWarranty && <tr><td>Warranty</td><td>{product.warrantyPeriod ? `${product.warrantyPeriod} months` : 'Yes'} ({product.warrantyType || 'N/A'})</td></tr>}
                  {product.hasGuarantee && <tr><td>Guarantee</td><td>{product.guaranteePeriod ? `${product.guaranteePeriod} months` : 'Yes'}</td></tr>}
                  {product.ageRange && <tr><td>Age Range</td><td>{product.ageRange.from}–{product.ageRange.to} years</td></tr>}
                  <tr><td>Stock</td><td>{stock} units</td></tr>
                  {sku && <tr><td>SKU</td><td>{sku}</td></tr>}
                  {selectedVariant?.weight && <tr><td>Weight</td><td>{selectedVariant.weight} g</td></tr>}
                  {selectedVariant?.dimensions && (
                    <tr>
                      <td>Dimensions</td>
                      <td>
                        {[selectedVariant.dimensions.length, selectedVariant.dimensions.width, selectedVariant.dimensions.height]
                          .filter(Boolean).join(' × ')} cm
                      </td>
                    </tr>
                  )}
                  {product.tags?.length > 0 && <tr><td>Tags</td><td>{product.tags.join(', ')}</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pdp__tab-reviews">
              {/* Rating summary */}
              <div className="pdp__review-summary">
                <div className="pdp__review-avg">
                  <span className="pdp__review-big">{(stats.avgRating || 0).toFixed(1)}</span>
                  <FiStar />
                  <span className="pdp__review-total">{stats.totalReviews || 0} reviews</span>
                </div>
              </div>

              {/* Review form */}
              <form className="pdp__review-form" onSubmit={handleReviewSubmit}>
                <h4>Write a Review</h4>
                <div className="pdp__review-form-grid">
                  <input placeholder="Your name" value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} required />
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <input placeholder="Review title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} required />
                <textarea placeholder="Your review…" rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} required />
                <button type="submit" disabled={submittingReview}>
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>

              {/* Reviews list */}
              <div className="pdp__review-list">
                {reviews.length === 0 ? (
                  <p className="pdp__no-reviews">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((review) => (
                    <div className="pdp__review-item" key={review._id || review.id}>
                      <div className="pdp__review-head">
                        <strong>{review.name}</strong>
                        <span className="pdp__review-rating"><FiStar /> {review.rating}</span>
                        <span className="pdp__review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h5>{review.title}</h5>
                      <p>{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ RELATED PRODUCTS ═══════════ */}
      {relatedProducts.length > 0 && (
        <section className="pdp__related">
          <h2>You May Also Like</h2>
          <div className="pdp__related-grid">
            {relatedProducts.slice(0, 4).map((p) => {
              const pName = p.productName || p.name;
              const pImg = Array.isArray(p.images) ? p.images[0] : p.image;
              const pPrice = Number(p.price || 0);
              return (
                <Link to={`/product/${p._id || p.id}`} className="pdp__related-card" key={p._id || p.id}>
                  <div className="pdp__related-img">
                    {pImg ? <img src={pImg} alt={pName} loading="lazy" /> : <span>📦</span>}
                  </div>
                  <div className="pdp__related-info">
                    <span className="pdp__related-cat">
                      {Array.isArray(p.categories) && p.categories.length > 0
                        ? (typeof p.categories[0] === 'object' ? (p.categories[0].catagoryName || p.categories[0].name || '') : '')
                        : (p.category?.catagoryName || '')}
                    </span>
                    <h4>{pName}</h4>
                    <span className="pdp__related-price">₹{pPrice.toFixed(0)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
