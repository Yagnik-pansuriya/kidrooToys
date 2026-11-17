import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiShoppingCart, FiFilter, FiGrid, FiList, FiChevronRight, FiHeart } from 'react-icons/fi';
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
import SEO from '../../../components/SEO/SEO';
import OfferSlot from '../../../components/OfferSlot/OfferSlot';
import { titleCase } from '../../../utils/seoTitle';
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

// Category links use the clean /category/:slug URL; /shop is the unfiltered list
const categoryPath = (cat) => (cat?.slug ? `/category/${cat.slug}` : `/shop?category=${cat._id || cat.id}`);

const Shop = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Rendered for both /category/:slug and legacy /shop?category=<id or slug>
  const categoryRef = slug || searchParams.get('category') || '';

  // ── Local state ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Back to page 1 whenever the category in the URL changes
  useEffect(() => {
    setPage(1);
  }, [categoryRef]);

  // ── Expand priceRange → minPrice / maxPrice ─────────────────────
  const priceFilter = useMemo(() => {
    const found = PRICE_RANGES.find((p) => p.value === selectedPriceRange);
    return found ? { minPrice: found.minPrice, maxPrice: found.maxPrice } : {};
  }, [selectedPriceRange]);

  // ── API queries ─────────────────────────────────────────────────
  const { isSuccess: categoriesLoaded, isError: categoriesFailed } = useGetCategoriesQuery();
  const { data: skillsResp } = useGetSkillsQuery();
  const skillsRaw = skillsResp?.data || skillsResp || [];
  const skillOptions = Array.isArray(skillsRaw) ? skillsRaw : [];

  const categories = useSelector((s) => s.category.categories) || [];
  const allCategories = Array.isArray(categories) ? categories : categories?.data || [];
  const categoryList = allCategories.filter((c) => c.isActive !== false);

  const activeCategory = useMemo(
    () => (categoryRef ? categoryList.find((c) => c.slug === categoryRef || (c._id || c.id) === categoryRef) : null),
    [categoryRef, categoryList]
  );
  const selectedCategory = activeCategory ? activeCategory._id || activeCategory.id : '';

  // Legacy ?category=<id> links → clean /category/:slug; unknown categories → /shop
  useEffect(() => {
    if (!categoryRef) return;
    if (activeCategory) {
      if (!slug && activeCategory.slug) navigate(`/category/${activeCategory.slug}`, { replace: true });
    } else if (categoriesLoaded || categoriesFailed) {
      navigate('/shop', { replace: true });
    }
  }, [categoryRef, slug, activeCategory, categoriesLoaded, categoriesFailed, navigate]);

  const { data: productsResponse, isFetching } = useGetProductsQuery(
    {
      page,
      limit: PRODUCTS_PER_PAGE,
      search: search.trim(),
      category: selectedCategory,
      ageRange: selectedAgeGroup,
      skill: selectedSkill,
      isActive: 'true',
      ...priceFilter,
    },
    // Wait for the category to resolve so the unfiltered list doesn't flash first
    { skip: Boolean(categoryRef) && !activeCategory }
  );

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

  const activeCategoryName = activeCategory?.catagoryName || activeCategory?.name || '';
  const activeCategoryDescription = activeCategory?.description || '';

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
  const handleCategoryClick = (cat) => {
    const isSame = cat && (cat._id || cat.id) === selectedCategory;
    setPage(1);
    navigate(cat && !isSame ? categoryPath(cat) : '/shop');
    setMobileFiltersOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedPriceRange('');
    setSelectedAgeGroup('');
    setSelectedSkill('');
    setPage(1);
    if (categoryRef) navigate('/shop');
  };

  const hasActiveFilters = selectedCategory || search.trim() || selectedPriceRange || selectedAgeGroup || selectedSkill;

  // ── SEO ──────────────────────────────────────────────────────────
  // Category titles: keep in sync with buildCategory() in kidrooBackend/src/routes/seoRenderRoutes.ts
  const shopSeoTitle = activeCategoryName
    ? `${titleCase(activeCategoryName)} for Kids - Buy Online in India | Kidroo Toys`
    : 'Shop All Kids Toys Online - Rattles, Puzzles, Board Games | Kidroo Toys';
  const shopSeoDescription = activeCategoryName
    ? activeCategoryDescription || `Shop the best ${activeCategoryName.toLowerCase()} toys for kids at Kidroo. Safe, educational, and fun! Browse our curated ${activeCategoryName.toLowerCase()} collection with free shipping on orders over ₹500.`
    : 'Browse all Kidroo toys: baby rattle sets, ramp racer car tracks, STEM puzzle mazes, hover balls and family board games. Safe, BIS approved toys delivered across India.';

  const shopCanonicalUrl = activeCategory
    ? `${window.location.origin}${categoryPath(activeCategory)}`
    : `${window.location.origin}/shop`;

  const shopJsonLd = activeCategory
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${activeCategoryName} Toys`,
        description: shopSeoDescription,
        url: shopCanonicalUrl,
        isPartOf: { '@type': 'WebSite', name: 'Kidroo Toys', url: window.location.origin },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
            { '@type': 'ListItem', position: 2, name: 'Shop', item: `${window.location.origin}/shop` },
            { '@type': 'ListItem', position: 3, name: activeCategoryName, item: shopCanonicalUrl },
          ],
        },
        ...(activeCategory.image && { image: activeCategory.image }),
        numberOfItems: total,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: shopSeoTitle,
        description: shopSeoDescription,
        url: `${window.location.origin}/shop`,
        isPartOf: { '@type': 'WebSite', name: 'Kidroo Toys', url: window.location.origin },
      };

  return (
    <div className="shop-page">
      {/* ── SEO Head ── */}
      <SEO
        title={shopSeoTitle}
        description={shopSeoDescription}
        keywords={`shop toys, buy toys online, ${activeCategoryName ? activeCategoryName.toLowerCase() + ' toys, ' : ''}kids toys, children toys, educational toys India`}
        canonical={shopCanonicalUrl}
        ogImage={activeCategory?.image}
        jsonLd={shopJsonLd}
      />
      {/* ═══ Breadcrumb ═══ */}
      <div className="shop-page__breadcrumb-bar">
        <div className="shop-page__container">
          <nav className="shop-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight />
            {activeCategoryName ? <Link to="/shop">Shop</Link> : <span className="shop-page__breadcrumb--active">Shop</span>}
            {activeCategoryName && (
              <>
                <FiChevronRight />
                <span className="shop-page__breadcrumb--active">{activeCategoryName}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* ═══ Shop Offers — top banner (also catches unplaced offers) ═══ */}
      <OfferSlot page="shop" section="top-banner" catchAll className="shop-offer-slot" />

      {/* ═══ Hero Banner ═══ */}
      <section className="shop-page__hero">
        <div className="shop-page__hero-deco" aria-hidden="true">
          {['🧸', '🎈', '🧩', '🚂', '🪀', '⭐'].map((toy, i) => (
            <span key={i} style={{ '--i': i }}>{toy}</span>
          ))}
        </div>
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
                ? activeCategoryDescription || `Explore our curated selection of ${activeCategoryName.toLowerCase()} toys`
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
                    onClick={() => handleCategoryClick(null)}
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
                      {/* Real links so crawlers and middle-click see /category/:slug */}
                      <Link
                        to={selectedCategory === catId ? '/shop' : categoryPath(cat)}
                        className={`shop-page__category-btn ${selectedCategory === catId ? 'shop-page__category-btn--active' : ''}`}
                        onClick={() => { setPage(1); setMobileFiltersOpen(false); }}
                      >
                        <span>{name}</span>
                      </Link>
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

            <OfferSlot page="shop" section="sidebar" />
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
                    <button onClick={() => handleCategoryClick(null)}><FiX /></button>
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
              <div className="shop-page__grid" aria-busy="true" aria-label="Loading products">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="shop-skeleton" style={{ '--i': i }}>
                    <div className="shop-skeleton__img" />
                    <div className="shop-skeleton__line" />
                    <div className="shop-skeleton__line shop-skeleton__line--short" />
                  </div>
                ))}
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
                {/* Keyed by page + first product so the pop-in replays on every page / filter change */}
                <div className="shop-page__grid" key={`${currentPage}-${productList[0]?._id || productList[0]?.id}`}>
                  {productList.map((product, index) => {
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

                    const card = (
                      <div className="shop-product-card" key={product._id || product.id} style={{ '--i': index }}>
                        {discount > 0 && (
                          <span className="shop-product-card__badge">-{discount}%</span>
                        )}
                        <div className="shop-product-card__img-wrap">
                          {imgSrc ? (
                            <img src={imgSrc} alt={name} className="shop-product-card__img" loading="lazy" />
                          ) : (
                            <div className="shop-product-card__img-placeholder">📦</div>
                          )}
                          <span className="shop-product-card__shine" aria-hidden="true" />
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
                        <Link to={`/product/${product.slug || product._id || product.id}`} className="shop-product-card__info">
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

                    // Offers placed "between products" break the grid after the 6th card (or the last one on short pages)
                    if (index !== Math.min(5, productList.length - 1)) return card;
                    return [
                      card,
                      <OfferSlot key="between-products" page="shop" section="between-products" className="shop-page__grid-offer" />,
                    ];
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
