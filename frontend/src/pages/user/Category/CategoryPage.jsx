import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiChevronRight, FiHeart } from 'react-icons/fi';
import { useDispatch } from 'react-redux';

import { useGetCategoryBySlugQuery } from '../../../store/ActionApi/categoryApi';
import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useToggleWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useCart } from '../../../context/CartContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useToast } from '../../../context/ToastContext';
import { toggleWishlistId } from '../../../store/ReducerApi/customerAuthSlice';
import Pagination from '../../../components/Pagination/Pagination';
import SEOHead from '../../../components/SEOHead/SEOHead';
import '../Shop/Shop.scss';

const PRODUCTS_PER_PAGE = 12;

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── Fetch category by slug ────────────────────────────────────
  const {
    data: categoryResp,
    isLoading: categoryLoading,
    isError: categoryError,
  } = useGetCategoryBySlugQuery(slug, { skip: !slug });

  const category = categoryResp?.data || categoryResp || null;
  const categoryId = category?._id || category?.id || '';
  const categoryName = category?.catagoryName || category?.name || '';
  const categoryImage = category?.image || '';
  const categorySlug = category?.slug || slug;

  // ── Fetch products for this category ──────────────────────────
  const [page, setPage] = useState(1);

  const { data: productsResponse, isFetching } = useGetProductsQuery(
    { page, limit: PRODUCTS_PER_PAGE, category: categoryId },
    { skip: !categoryId }
  );

  const inner = productsResponse?.data || productsResponse || {};
  const productList = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
  const total = Number(inner?.total) || productList.length;
  const totalPages = Math.ceil(total / (Number(inner?.limit) || PRODUCTS_PER_PAGE)) || 1;
  const currentPage = Number(inner?.page) || page;

  const { addToCart } = useCart();
  const { requireAuth, isInWishlist } = useCustomerAuth();
  const { showSuccess, showError } = useToast();
  const [toggleWishlistApi] = useToggleWishlistMutation();

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth('Please login to save items to your wishlist')) return;
    try {
      await toggleWishlistApi(productId).unwrap();
      dispatch(toggleWishlistId(productId));
      showSuccess(isInWishlist(productId) ? 'Removed from wishlist' : 'Added to wishlist ❤️');
    } catch (err) {
      showError('Failed to update wishlist');
    }
  };

  // ── Redirect if category not found ────────────────────────────
  useEffect(() => {
    if (categoryError) {
      navigate('/shop', { replace: true });
    }
  }, [categoryError, navigate]);

  // ── SEO ───────────────────────────────────────────────────────
  const seoTitle = categoryName
    ? `${categoryName} Toys - Buy Online | Kidroo`
    : 'Category - Kidroo Toys';
  const seoDescription = categoryName
    ? `Shop the best ${categoryName.toLowerCase()} toys for kids at Kidroo. Safe, educational, and fun! Browse our curated ${categoryName.toLowerCase()} collection with free shipping on orders over ₹500.`
    : 'Browse our curated toy categories at Kidroo Toys.';
  const seoKeywords = categoryName
    ? `${categoryName.toLowerCase()} toys, buy ${categoryName.toLowerCase()} toys online, ${categoryName.toLowerCase()} for kids, kidroo ${categoryName.toLowerCase()}, educational ${categoryName.toLowerCase()} toys, kids toys India`
    : 'kids toys, buy toys online, kidroo toys';
  const canonicalUrl = `${window.location.origin}/category/${categorySlug}`;

  const jsonLd = categoryName
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${categoryName} Toys`,
        description: seoDescription,
        url: canonicalUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Kidroo Toys',
          url: window.location.origin,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: window.location.origin,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Shop',
              item: `${window.location.origin}/shop`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: categoryName,
              item: canonicalUrl,
            },
          ],
        },
        ...(categoryImage && { image: categoryImage }),
        numberOfItems: total,
      }
    : null;

  if (categoryLoading) {
    return (
      <div className="shop-page">
        <div className="shop-page__loading">
          <div className="shop-page__spinner" />
          <p>Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      {/* ── SEO Head ── */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        ogType="website"
        ogImage={categoryImage}
        jsonLd={jsonLd}
      />

      {/* ═══ Breadcrumb ═══ */}
      <div className="shop-page__breadcrumb-bar">
        <div className="shop-page__container">
          <nav className="shop-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight />
            <Link to="/shop">Shop</Link>
            <FiChevronRight />
            <span className="shop-page__breadcrumb--active">{categoryName}</span>
          </nav>
        </div>
      </div>

      {/* ═══ Hero Banner ═══ */}
      <section className="shop-page__hero">
        <div className="shop-page__container">
          <div className="shop-page__hero-content">
            <h1 className="shop-page__hero-title">{categoryName}</h1>
            <p className="shop-page__hero-desc">
              Explore our curated selection of {categoryName.toLowerCase()} toys
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Product Grid ═══ */}
      <div className="shop-page__main">
        <div className="shop-page__container">
          <div className="shop-page__content" style={{ maxWidth: '100%' }}>
            <div className="shop-page__toolbar">
              <div className="shop-page__toolbar-left">
                <span className="shop-page__results-count">
                  {total > 0 ? (
                    <>Showing <strong>{productList.length}</strong> of <strong>{total}</strong> products</>
                  ) : 'No products found'}
                </span>
              </div>
            </div>

            {isFetching ? (
              <div className="shop-page__loading">
                <div className="shop-page__spinner" />
                <p>Loading products...</p>
              </div>
            ) : productList.length === 0 ? (
              <div className="shop-page__empty">
                <div className="shop-page__empty-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>No products available in this category yet</p>
                <Link to="/shop" className="shop-page__empty-btn">
                  Browse All Products
                </Link>
              </div>
            ) : (
              <>
                <div className="shop-page__grid">
                  {productList.map((product) => {
                    const name = product.productName || product.name;
                    const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                    const price = Number(product.price || 0);
                    const originalPrice = Number(product.originalPrice || 0);
                    const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);

                    return (
                      <div className="shop-product-card" key={product._id || product.id}>
                        {discount > 0 && (
                          <span className="shop-product-card__badge">-{discount}%</span>
                        )}
                        <div className="shop-product-card__img-wrap">
                          {imgSrc ? (
                            <img src={imgSrc} alt={name} className="shop-product-card__img" loading="lazy" />
                          ) : (
                            <div className="shop-product-card__img-placeholder">📦</div>
                          )}
                          <div className="shop-product-card__hover-overlay">
                            <button
                              className="shop-product-card__cart-btn"
                              onClick={() => addToCart(product)}
                              title="Add to cart"
                            >
                              <FiShoppingCart /> Add to Cart
                            </button>
                          </div>
                          <button
                            className={`shop-product-card__wish-btn ${isInWishlist(product._id || product.id) ? 'shop-product-card__wish-btn--active' : ''}`}
                            onClick={(e) => handleToggleWishlist(e, product._id || product.id)}
                            title="Add to wishlist"
                          >
                            <FiHeart />
                          </button>
                        </div>
                        <Link to={`/product/${product._id || product.id}`} className="shop-product-card__info">
                          <span className="shop-product-card__category">{categoryName}</span>
                          <div className="shop-product-card__name-row">
                            <h3 className="shop-product-card__name">{name}</h3>
                            {product.newArrival && (
                              <span className="shop-product-card__new-tag">NEW</span>
                            )}
                          </div>
                          <div className="shop-product-card__pricing">
                            <span className="shop-product-card__price">₹{price.toFixed(0)}</span>
                            {originalPrice > price && (
                              <span className="shop-product-card__original">₹{originalPrice.toFixed(0)}</span>
                            )}
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  limit={PRODUCTS_PER_PAGE}
                  onPageChange={(p) => setPage(p)}
                  className="shop-page__pagination"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default CategoryPage;
