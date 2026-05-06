import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiShoppingCart, FiFilter, FiGrid, FiList, FiArrowRight, FiChevronRight, FiHeart } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';

import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useGetSkillsQuery } from '../../../store/ActionApi/skillApi';
import { useToggleWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useCart } from '../../../context/CartContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useToast } from '../../../context/ToastContext';
import { toggleWishlistId } from '../../../store/ReducerApi/customerAuthSlice';
import Pagination from '../../../components/Pagination/Pagination';
import SEOHead from '../../../components/SEOHead/SEOHead';
import './Shop.scss';

const PRODUCTS_PER_PAGE = 12;

// ── Fixed filter option lists ───────────────────────────────────
const PRICE_RANGES = [
  { value: 'under499',  label: 'Under ₹499',  minPrice: '',    maxPrice: '499'  },
  { value: 'under999',  label: 'Under ₹999',  minPrice: '',    maxPrice: '999'  },
  { value: 'above1000', label: 'Above ₹1000', minPrice: '1000', maxPrice: '' },
];

const AGE_GROUPS = [
  { value: '0-2', label: '0–2 years' },
  { value: '2-4', label: '2–4 years' },
  { value: '4-6', label: '4–6 years' },
  { value: '6-8', label: '6–8 years' },
  { value: '8+',  label: '8+ years'  },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';

  // ── Local state ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync category from URL
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
    setPage(1);
  }, [categoryFromUrl]);

  // ── Expand priceRange → minPrice / maxPrice ─────────────────────
  const priceFilter = useMemo(() => {
    const found = PRICE_RANGES.find((p) => p.value === selectedPriceRange);
    return found ? { minPrice: found.minPrice, maxPrice: found.maxPrice } : {};
  }, [selectedPriceRange]);

  // ── API queries ─────────────────────────────────────────────────
  useGetCategoriesQuery();
  const { data: skillsResp } = useGetSkillsQuery();
  const skillsRaw = skillsResp?.data || skillsResp || [];
  const skillOptions = Array.isArray(skillsRaw) ? skillsRaw : [];

  const { data: productsResponse, isFetching } = useGetProductsQuery({
    page,
    limit: PRODUCTS_PER_PAGE,
    search: search.trim(),
    category: selectedCategory,
    ageRange: selectedAgeGroup,
    skill: selectedSkill,
    ...priceFilter,
  });

  const categories = useSelector((s) => s.category.categories) || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.data || [];

  // Extract products & pagination directly from the query response (not shared Redux slice)
  const inner = productsResponse?.data || productsResponse || {};
  const productList = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
  const total = Number(inner?.total) || productList.length;
  const totalPages = Math.ceil(total / (Number(inner?.limit) || PRODUCTS_PER_PAGE)) || 1;
  const currentPage = Number(inner?.page) || page;

  const { addToCart } = useCart();
  const dispatch = useDispatch();
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

  // Find active category name for breadcrumb
  const activeCategoryName = useMemo(() => {
    if (!selectedCategory) return '';
    const cat = categoryList.find((c) => (c._id || c.id) === selectedCategory);
    return cat?.catagoryName || cat?.name || '';
  }, [selectedCategory, categoryList]);

  // Active skill name for filter tag
  const activeSkillName = useMemo(() => {
    if (!selectedSkill) return '';
    const s = skillOptions.find((sk) => (sk._id || sk.id) === selectedSkill);
    return s?.name || '';
  }, [selectedSkill, skillOptions]);

  // Active price label
  const activePriceLabel = useMemo(() => {
    const found = PRICE_RANGES.find((p) => p.value === selectedPriceRange);
    return found?.label || '';
  }, [selectedPriceRange]);

  // Active age label
  const activeAgeLabel = useMemo(() => {
    const found = AGE_GROUPS.find((a) => a.value === selectedAgeGroup);
    return found?.label || '';
  }, [selectedAgeGroup]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleCategoryClick = (catId) => {
    const newCat = catId === selectedCategory ? '' : catId;
    setSelectedCategory(newCat);
    setPage(1);
    if (newCat) {
      setSearchParams({ category: newCat });
    } else {
      setSearchParams({});
    }
    setMobileFiltersOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedPriceRange('');
    setSelectedAgeGroup('');
    setSelectedSkill('');
    setPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || search.trim() || selectedPriceRange || selectedAgeGroup || selectedSkill;

  // ── SEO ──────────────────────────────────────────────────────────
  // Find slug for active category (if any) for canonical URL
  const activeCategorySlug = useMemo(() => {
    if (!selectedCategory) return '';
    const cat = categoryList.find((c) => (c._id || c.id) === selectedCategory);
    return cat?.slug || '';
  }, [selectedCategory, categoryList]);

  const shopSeoTitle = activeCategoryName
    ? `${activeCategoryName} Toys - Shop Online`
    : 'Shop All Toys Online';
  const shopSeoDescription = activeCategoryName
    ? `Browse our curated collection of ${activeCategoryName.toLowerCase()} toys for kids. Safe, educational, and fun! Free shipping on orders over ₹500.`
    : 'Explore our full collection of premium kids toys. Filter by category, age, price, and skills. Free shipping on orders over ₹500.';

  // If the selected category has a slug, canonical should point to the clean category URL
  const shopCanonicalUrl = activeCategorySlug
    ? `${window.location.origin}/category/${activeCategorySlug}`
    : `${window.location.origin}/shop`;

  return (
    <div className="shop-page">
      {/* ── SEO Head ── */}
      <SEOHead
        title={shopSeoTitle}
        description={shopSeoDescription}
        keywords={`shop toys, buy toys online, ${activeCategoryName ? activeCategoryName.toLowerCase() + ' toys, ' : ''}kids toys, children toys, educational toys India`}
        canonicalUrl={shopCanonicalUrl}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: shopSeoTitle,
          description: shopSeoDescription,
          url: `${window.location.origin}/shop`,
          isPartOf: { '@type': 'WebSite', name: 'Kidroo Toys', url: window.location.origin },
        }}
      />
      {/* ═══ Breadcrumb ═══ */}
      <div className="shop-page__breadcrumb-bar">
        <div className="shop-page__container">
          <nav className="shop-page__breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight />
            <span className={activeCategoryName ? '' : 'shop-page__breadcrumb--active'}>Shop</span>
            {activeCategoryName && (
              <>
                <FiChevronRight />
                <span className="shop-page__breadcrumb--active">{activeCategoryName}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* ═══ Hero Banner ═══ */}
      <section className="shop-page__hero">
        <div className="shop-page__container">
          <div className="shop-page__hero-content">
            <h1 className="shop-page__hero-title">
              {activeCategoryName ? (
                <>{activeCategoryName}</>
              ) : (
                <>Our <span className="shop-page__accent">Collection</span></>
              )}
            </h1>
            <p className="shop-page__hero-desc">
              {activeCategoryName
                ? `Explore our curated selection of ${activeCategoryName.toLowerCase()} toys`
                : 'Discover toys that inspire creativity, learning, and endless fun'}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Main Content ═══ */}
      <div className="shop-page__main">
        <div className="shop-page__container shop-page__layout">
          {/* ── Sidebar ── */}
          <aside className={`shop-page__sidebar ${mobileFiltersOpen ? 'shop-page__sidebar--open' : ''}`}>
            <div className="shop-page__sidebar-header">
              <h3>Filters</h3>
              <button
                className="shop-page__sidebar-close"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <FiX />
              </button>
            </div>

            {/* Search */}
            <div className="shop-page__filter-group">
              <label className="shop-page__filter-label">Search</label>
              <form onSubmit={handleSearch} className="shop-page__search-form">
                <FiSearch className="shop-page__search-icon" />
                <input
                  type="text"
                  placeholder="Search toys..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="shop-page__search-input"
                />
                {search && (
                  <button
                    type="button"
                    className="shop-page__search-clear"
                    onClick={() => { setSearch(''); setPage(1); }}
                  >
                    <FiX />
                  </button>
                )}
              </form>
            </div>

            {/* Categories */}
            <div className="shop-page__filter-group">
              <label className="shop-page__filter-label">Categories</label>
              <ul className="shop-page__category-list">
                <li>
                  <button
                    className={`shop-page__category-btn ${!selectedCategory ? 'shop-page__category-btn--active' : ''}`}
                    onClick={() => handleCategoryClick('')}
                  >
                    <span>All Categories</span>
                    <span className="shop-page__category-count">{total || '—'}</span>
                  </button>
                </li>
                {categoryList.map((cat) => {
                  const catId = cat._id || cat.id;
                  const name = cat.catagoryName || cat.name;
                  return (
                    <li key={catId}>
                      <button
                        className={`shop-page__category-btn ${selectedCategory === catId ? 'shop-page__category-btn--active' : ''}`}
                        onClick={() => handleCategoryClick(catId)}
                      >
                        <span>{name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>


            {hasActiveFilters && (
              <button className="shop-page__clear-btn" onClick={clearFilters}>
                <FiX /> Clear All Filters
              </button>
            )}
          </aside>

          {/* Mobile filter overlay */}
          {mobileFiltersOpen && (
            <div
              className="shop-page__sidebar-overlay"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* ── Product Grid ── */}
          <div className="shop-page__content">
            {/* Toolbar */}
            <div className="shop-page__toolbar">
              <div className="shop-page__toolbar-left">
                <button
                  className="shop-page__filter-toggle"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <FiFilter /> Filters
                </button>
                <span className="shop-page__results-count">
                  {total > 0 ? (
                    <>Showing <strong>{productList.length}</strong> of <strong>{total}</strong> products</>
                  ) : 'No products found'}
                </span>
              </div>

            </div>

            {/* ── Filter Dropdowns Row ── */}
            <div className="shop-page__filter-bar">
              <select
                className="shop-page__filter-select"
                value={selectedPriceRange}
                onChange={(e) => { setSelectedPriceRange(e.target.value); setPage(1); }}
              >
                <option value="">All Prices</option>
                {PRICE_RANGES.map((pr) => (
                  <option key={pr.value} value={pr.value}>{pr.label}</option>
                ))}
              </select>

              <select
                className="shop-page__filter-select"
                value={selectedAgeGroup}
                onChange={(e) => { setSelectedAgeGroup(e.target.value); setPage(1); }}
              >
                <option value="">All Ages</option>
                {AGE_GROUPS.map((ag) => (
                  <option key={ag.value} value={ag.value}>{ag.label}</option>
                ))}
              </select>

              {skillOptions.length > 0 && (
                <select
                  className="shop-page__filter-select"
                  value={selectedSkill}
                  onChange={(e) => { setSelectedSkill(e.target.value); setPage(1); }}
                >
                  <option value="">All Skills</option>
                  {skillOptions.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="shop-page__active-filters">
                {activeCategoryName && (
                  <span className="shop-page__filter-tag">
                    {activeCategoryName}
                    <button onClick={() => handleCategoryClick('')}><FiX /></button>
                  </span>
                )}
                {activePriceLabel && (
                  <span className="shop-page__filter-tag">
                    {activePriceLabel}
                    <button onClick={() => { setSelectedPriceRange(''); setPage(1); }}><FiX /></button>
                  </span>
                )}
                {activeAgeLabel && (
                  <span className="shop-page__filter-tag">
                    {activeAgeLabel}
                    <button onClick={() => { setSelectedAgeGroup(''); setPage(1); }}><FiX /></button>
                  </span>
                )}
                {activeSkillName && (
                  <span className="shop-page__filter-tag">
                    {activeSkillName}
                    <button onClick={() => { setSelectedSkill(''); setPage(1); }}><FiX /></button>
                  </span>
                )}
                {search.trim() && (
                  <span className="shop-page__filter-tag">
                    "{search}"
                    <button onClick={() => { setSearch(''); setPage(1); }}><FiX /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid */}
            {isFetching ? (
              <div className="shop-page__loading">
                <div className="shop-page__spinner" />
                <p>Loading products...</p>
              </div>
            ) : productList.length === 0 ? (
              <div className="shop-page__empty">
                <div className="shop-page__empty-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button className="shop-page__empty-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
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
                    const category = (() => {
                      if (Array.isArray(product.categories) && product.categories.length > 0) {
                        const first = product.categories[0];
                        return typeof first === 'object' ? (first.catagoryName || first.name || '') : '';
                      }
                      return product.category?.catagoryName || product.category?.name || '';
                    })();

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
                          {category && <span className="shop-product-card__category">{category}</span>}
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

export default Shop;
