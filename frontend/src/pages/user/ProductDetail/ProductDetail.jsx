import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiStar, FiTruck, FiRefreshCw, FiShoppingCart, FiMinus, FiPlus, FiChevronRight, FiChevronLeft, FiShield, FiPackage, FiPlay, FiHeart, FiZap } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useGetProductByIdQuery, useGetRelatedProductsQuery, useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetProductReviewsQuery, useGetProductReviewStatsQuery, useAddReviewMutation } from '../../../store/ActionApi/reviewApi';
import { useToggleWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { toggleWishlistId } from '../../../store/ReducerApi/customerAuthSlice';
import Loader from '../../../components/Loader/Loader';
import SEOHead from '../../../components/SEOHead/SEOHead';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  const { requireAuth, isCustomerAuthenticated, isInWishlist, customer } = useCustomerAuth();
  const [toggleWishlistApi] = useToggleWishlistMutation();

  // ── API data ──────────────────────────────────────────────────
  const { data: productResp, isLoading } = useGetProductByIdQuery(slug);
  const product = productResp?.data || productResp;
  const productId = product?._id || product?.id;

  const { data: reviewsResp } = useGetProductReviewsQuery(productId, { skip: !productId });
  const { data: statsResp } = useGetProductReviewStatsQuery(productId, { skip: !productId });
  const [addReviewApi, { isLoading: submittingReview }] = useAddReviewMutation();

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

  // ── SKU-based related products (same SKU = grouped) ───────────
  const { data: skuRelatedResp } = useGetRelatedProductsQuery(productId, {
    skip: !productId || !product,
  });
  const skuRelatedRaw = skuRelatedResp?.data || skuRelatedResp || [];
  const skuRelatedProducts = Array.isArray(skuRelatedRaw) ? skuRelatedRaw : [];

  // Category-based "You May Also Like" products
  const primaryCategoryId = productCategories[0]?.id || '';
  const { data: relatedResp } = useGetProductsQuery(
    { page: 1, limit: 4, category: primaryCategoryId },
    { skip: !primaryCategoryId }
  );
  const relatedInner = relatedResp?.data || relatedResp;
  const relatedProducts = (relatedInner?.data || relatedInner || [])
    .filter((p) => (p._id || p.id) !== productId);

  // ── Local state ───────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Review form
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', comment: '' });



  if (isLoading) return <Loader message="Loading product…" />;
  if (!product) return <div className="pdp-empty">Product not found.</div>;

  const name = product.productName || product.name;

  const productImages = product.images?.length ? product.images : [product.image].filter(Boolean);
  const images = productImages;

  // YouTube embed helper
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    return null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(product.youtubeUrl);
  const youtubeEmbedUrl2 = getYoutubeEmbedUrl(product.youtubeUrl2);
  const videoCount = (youtubeEmbedUrl ? 1 : 0) + (youtubeEmbedUrl2 ? 1 : 0);
  const totalSlides = images.length + videoCount;

  // Determine which video URL to show for a given slide index
  const getVideoForSlide = (slideIdx) => {
    const videoStartIdx = images.length;
    if (slideIdx === videoStartIdx && youtubeEmbedUrl) return youtubeEmbedUrl;
    if (slideIdx === videoStartIdx + (youtubeEmbedUrl ? 1 : 0) && youtubeEmbedUrl2) return youtubeEmbedUrl2;
    return null;
  };
  const isVideoSlide = selectedImage >= images.length && selectedImage < totalSlides;
  const currentVideoUrl = getVideoForSlide(selectedImage);

  const handlePrevSlide = () => setSelectedImage((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  const handleNextSlide = () => setSelectedImage((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));

  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : (product.discountPercentage || 0);
  const categoryName = productCategories.map((c) => c.name).filter(Boolean).join(', ');
  const stock = product.stock || 0;
  const inStock = stock > 0;
  const productCode = product.productCode || '';
  const skuCode = product.skuCode || '';

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    showSuccess(`${name} added to cart!`);
  };

  const handleBuyNow = () => {
    const proceed = () => {
      addToCart({ ...product, quantity });
      showSuccess(`${name} added to cart!`);
      navigate('/checkout');
    };
    if (!requireAuth('Please login to purchase this product', proceed)) return;
    proceed();
  };

  const handleWishlistToggle = async () => {
    if (!requireAuth('Please login to save items to your wishlist')) return;
    try {
      await toggleWishlistApi(productId).unwrap();
      dispatch(toggleWishlistId(productId));
      showSuccess(isInWishlist(productId) ? 'Removed from wishlist' : 'Added to wishlist ❤️');
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
      await addReviewApi({ productId, body }).unwrap();
      showSuccess('Review added successfully!');
      setReviewForm({ name: '', rating: 5, title: '', comment: '' });
    } catch (err) {
      showError(err?.data?.message || 'Failed to add review');
    }
  };

  // ── SEO: Build JSON-LD Product structured data ────────────────
  const seoTitle = product.seoTitle || `Buy ${name} Online`;
  const seoDescription = product.seoDescription
    || `${product.description?.substring(0, 150)}${product.description?.length > 150 ? '…' : ''}`;
  const seoKeywords = Array.isArray(product.seoKeywords)
    ? product.seoKeywords.join(', ')
    : (product.tags?.join(', ') || '');
  const productUrl = `${window.location.origin}/product/${slug}`;
  const productImage = productImages[0] || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // ── Product Schema ──
      {
        '@type': 'Product',
        name: name,
        description: product.description,
        image: productImages,
        sku: productCode,
        brand: { '@type': 'Brand', name: 'Kidroo Toys' },
        category: categoryName || 'Toys',
        url: productUrl,
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'INR',
          price: price.toFixed(2),
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'Kidroo Toys' },
          ...(originalPrice > price && {
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }),
        },
        ...(product.ratings > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratings,
            reviewCount: product.numReviews || 1,
            bestRating: 5,
            worstRating: 1,
          },
        }),
        ...(Array.isArray(product.ageRange) && product.ageRange.length > 0 && {
          audience: {
            '@type': 'PeopleAudience',
            suggestedMinAge: product.ageRange[0].split('-')[0] || '0',
            suggestedMaxAge: (() => {
              const last = product.ageRange[product.ageRange.length - 1];
              return last.includes('+') ? '99' : (last.split('-')[1] || '99');
            })(),
          },
        }),
      },
      // ── BreadcrumbList Schema ──
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${window.location.origin}/shop` },
          ...(categoryName ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${window.location.origin}/shop?category=${product.categories?.[0]?._id || ''}` }] : []),
          { '@type': 'ListItem', position: categoryName ? 4 : 3, name: name, item: productUrl },
        ],
      },
    ],
  };

  return (
    <div className="pdp">
      {/* ── SEO Head ── */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={productUrl}
        ogType="product"
        ogImage={productImage}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        jsonLd={jsonLd}
      />

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
                    src={currentVideoUrl}
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
                  <span>Video 1</span>
                </button>
              )}
              {youtubeEmbedUrl2 && (
                <button
                  className={`pdp__thumb pdp__thumb--video ${selectedImage === images.length + (youtubeEmbedUrl ? 1 : 0) ? 'pdp__thumb--active' : ''}`}
                  onClick={() => setSelectedImage(images.length + (youtubeEmbedUrl ? 1 : 0))}
                >
                  <FiPlay className="pdp__thumb-play" />
                  <span>Video 2</span>
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


          <div className="pdp__desc" dangerouslySetInnerHTML={{ __html: product.description }} />

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
          {Array.isArray(product.ageRange) && product.ageRange.length > 0 && (
            <div className="pdp__option-group">
              <label>Age Range</label>
              <span className="pdp__age-tag">
                {product.ageRange.map((r) => r.includes('+') ? `${r} years` : `${r} years`).join(', ')}
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

          {/* ── Available Variants (SKU-grouped products) ── */}
          {skuRelatedProducts.length > 0 && (
            <div className="pdp__variants-section">
              <label className="pdp__variants-label">Available Variants</label>
              <div className="pdp__variants-grid">
                {skuRelatedProducts.map((rp) => {
                  const rpName = rp.productName || rp.name;
                  const rpImg = Array.isArray(rp.images) ? rp.images[0] : rp.image;
                  const rpPrice = Number(rp.price || 0);
                  const rpOriginal = Number(rp.originalPrice || 0);
                  const rpDiscount = rpOriginal > rpPrice ? Math.round((1 - rpPrice / rpOriginal) * 100) : 0;
                  const rpStock = rp.stock || 0;
                  const rpInStock = rpStock > 0;
                  return (
                    <Link
                      key={rp._id || rp.id}
                      to={`/product/${rp.slug || rp._id || rp.id}`}
                      className="pdp__variant-card"
                    >
                      <div className="pdp__variant-card-img">
                        {rpImg ? (
                          <img src={rpImg} alt={rpName} loading="lazy" />
                        ) : (
                          <span className="pdp__variant-card-placeholder">📦</span>
                        )}
                        {rpDiscount > 0 && (
                          <span className="pdp__variant-card-badge">-{rpDiscount}%</span>
                        )}
                      </div>
                      <div className="pdp__variant-card-info">
                        <span className="pdp__variant-card-name">{rpName}</span>
                        <div className="pdp__variant-card-pricing">
                          <span className="pdp__variant-card-price">₹{rpPrice.toFixed(0)}</span>
                          {rpOriginal > rpPrice && (
                            <span className="pdp__variant-card-original">₹{rpOriginal.toFixed(0)}</span>
                          )}
                        </div>
                        <span className={`pdp__variant-card-stock ${rpInStock ? 'pdp__variant-card-stock--in' : 'pdp__variant-card-stock--out'}`}>
                          {rpInStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU & Stock indicator */}
          <div className="pdp__variant-meta">
            {skuCode && (
              <span className="pdp__sku">
                <FiPackage /> SKU: {skuCode}
              </span>
            )}
            <span className={`pdp__stock-indicator ${inStock ? 'pdp__stock-indicator--in' : 'pdp__stock-indicator--out'}`}>
              {inStock ? (
                stock <= 5 ? `Only ${stock} left!` : 'In Stock'
              ) : 'Out of Stock'}
            </span>
          </div>


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
              className={`pdp__wishlist-btn ${isInWishlist(productId) ? 'pdp__wishlist-btn--active' : ''}`}
              onClick={handleWishlistToggle}
              title={isInWishlist(productId) ? 'Remove from wishlist' : 'Add to wishlist'}
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
              <div className="pdp__rich-content" dangerouslySetInnerHTML={{ __html: product.description }} />
              {product.tags?.length > 0 && (
                <div className="pdp__bullet-points">
                  <h4>Bullet Points</h4>
                  <ul className="pdp__bullet-list">
                    {product.tags.map((tag, i) => (
                      <li key={i}>{tag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="pdp__tab-specs">

              {/* ── General Information Table ── */}
              <h4 className="pdp__specs-section-title">General Information</h4>
              <table className="pdp__specs-table">
                <tbody>
                  <tr><td>Brand</td><td>Kidroo</td></tr>
                  <tr><td>Categories</td><td>{categoryName || 'Uncategorized'}</td></tr>
                  {product.hasWarranty && <tr><td>Warranty</td><td>{product.warrantyPeriod ? `${product.warrantyPeriod} months` : 'Yes'} ({product.warrantyType || 'N/A'})</td></tr>}
                  {product.hasGuarantee && <tr><td>Guarantee</td><td>{product.guaranteePeriod ? `${product.guaranteePeriod} months` : 'Yes'}</td></tr>}
                  {Array.isArray(product.ageRange) && product.ageRange.length > 0 && <tr><td>Age Range</td><td>{product.ageRange.join(', ')} years</td></tr>}
                  <tr><td>Stock</td><td>{stock} units</td></tr>
                  {productCode && <tr><td>Product Code</td><td>{productCode}</td></tr>}
                  {skuCode && <tr><td>SKU Code</td><td>{skuCode}</td></tr>}
                  {product.tags?.length > 0 && <tr><td>Bullet Points</td><td><ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{product.tags.map((t, i) => <li key={i}>{t}</li>)}</ul></td></tr>}
                </tbody>
              </table>

              {/* ── Custom Product Specifications Table (from admin) ── */}
              {Array.isArray(product.specifications) && product.specifications.length > 0 && (
                <>
                  <h4 className="pdp__specs-section-title">Product Specifications</h4>
                  <table className="pdp__specs-table pdp__specs-table--custom">
                    <thead>
                      <tr>
                        <th>Specification</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.specifications.map((spec, idx) => (
                        <tr key={idx}>
                          <td>{spec.key}</td>
                          <td>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
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
                <Link to={`/product/${p.slug || p._id || p.id}`} className="pdp__related-card" key={p._id || p.id}>
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
