import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiTruck, FiRefreshCw, FiShoppingCart, FiMinus, FiPlus, FiChevronRight } from 'react-icons/fi';
import { useGetProductByIdQuery } from '../../../store/ActionApi/productApi';
import { useGetVariantsQuery } from '../../../store/ActionApi/variantApi';
import { useGetProductReviewsQuery, useGetProductReviewStatsQuery, useAddReviewMutation } from '../../../store/ActionApi/reviewApi';
import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  // ── API data ──────────────────────────────────────────────────
  const { data: productResp, isLoading } = useGetProductByIdQuery(id);
  const { data: variantsResp } = useGetVariantsQuery(id);
  const { data: reviewsResp } = useGetProductReviewsQuery(id);
  const { data: statsResp } = useGetProductReviewStatsQuery(id);
  const [addReviewApi, { isLoading: submittingReview }] = useAddReviewMutation();

  const product = productResp?.data || productResp;
  const variants = variantsResp?.data || variantsResp || [];
  const reviews = reviewsResp?.data || reviewsResp || [];
  const stats = statsResp?.data || statsResp || {};

  // Related products (same category)
  const categoryId = product?.category?._id || product?.category;
  const { data: relatedResp } = useGetProductsQuery(
    { page: 1, limit: 4, category: categoryId || '' },
    { skip: !categoryId }
  );
  const relatedInner = relatedResp?.data || relatedResp;
  const relatedProducts = (relatedInner?.data || relatedInner || [])
    .filter((p) => (p._id || p.id) !== id);

  // ── Local state ───────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  // Review form
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', comment: '' });

  if (isLoading) return <Loader message="Loading product…" />;
  if (!product) return <div className="pdp-empty">Product not found.</div>;

  const name = product.productName || product.name;
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price || 0);
  const originalPrice = selectedVariant ? Number(selectedVariant.originalPrice || 0) : Number(product.originalPrice || 0);
  const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
  const categoryName = product.category?.catagoryName || product.category?.name || '';
  const inStock = (selectedVariant ? selectedVariant.stock : product.stock) > 0;

  // Extract unique attribute keys from variants for selection
  const variantList = Array.isArray(variants) ? variants : [];
  const attrKeys = [...new Set(variantList.flatMap((v) => Object.keys(v.attributes || {})))];

  const handleAddToCart = () => {
    addToCart({ ...product, quantity, selectedVariant });
    showSuccess(`${name} added to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await addReviewApi({ productId: id, body: reviewForm }).unwrap();
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
        {categoryName && (
          <>
            <Link to={`/?category=${categoryId}`}>{categoryName}</Link>
            <FiChevronRight />
          </>
        )}
        <span>{name}</span>
      </nav>

      {/* ═══════════ PRODUCT MAIN ═══════════ */}
      <section className="pdp__main">
        {/* Image gallery */}
        <div className="pdp__gallery">
          <div className="pdp__main-image">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={name} />
            ) : (
              <div className="pdp__img-placeholder">📦</div>
            )}
            {discount > 0 && <span className="pdp__badge">-{discount}%</span>}
          </div>
          {images.length > 1 && (
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

          {/* Age Range */}
          {product.ageRange && (
            <div className="pdp__option-group">
              <label>Age Range</label>
              <span className="pdp__age-tag">
                {product.ageRange.from}–{product.ageRange.to} years
              </span>
            </div>
          )}

          {/* Variant selectors */}
          {attrKeys.length > 0 && attrKeys.map((key) => {
            const values = [...new Set(variantList.map((v) => v.attributes?.[key]).filter(Boolean))];
            return (
              <div className="pdp__option-group" key={key}>
                <label>{key}</label>
                <div className="pdp__option-pills">
                  {values.map((val) => {
                    const isSelected = selectedVariant?.attributes?.[key] === val;
                    return (
                      <button
                        key={val}
                        className={`pdp__pill ${isSelected ? 'pdp__pill--active' : ''}`}
                        onClick={() => {
                          const match = variantList.find((v) => v.attributes?.[key] === val);
                          setSelectedVariant(match || null);
                        }}
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
          })}

          {/* Quantity */}
          <div className="pdp__option-group">
            <label>Quantity</label>
            <div className="pdp__qty">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}><FiPlus /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="pdp__actions">
            <button className="pdp__add-btn" onClick={handleAddToCart} disabled={!inStock}>
              <FiShoppingCart /> {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button className="pdp__buy-btn" disabled={!inStock}>
              Buy Now
            </button>
          </div>

          {/* Trust badges */}
          <div className="pdp__trust">
            <span><FiTruck /> Free Shipping</span>
            <span><FiRefreshCw /> 30-Day Returns</span>
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
                  <tr><td>Category</td><td>{categoryName}</td></tr>
                  {product.ageRange && <tr><td>Age Range</td><td>{product.ageRange.from}–{product.ageRange.to} years</td></tr>}
                  <tr><td>Stock</td><td>{product.stock} units</td></tr>
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
                    <span className="pdp__related-cat">{p.category?.catagoryName || ''}</span>
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
