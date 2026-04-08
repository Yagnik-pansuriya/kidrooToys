import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiShoppingCart, FiFilter, FiGrid, FiList, FiArrowRight, FiChevronRight } from 'react-icons/fi';
import { useSelector } from 'react-redux';

import { useGetProductsQuery } from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useCart } from '../../../context/CartContext';
import Pagination from '../../../components/Pagination/Pagination';
import './Shop.scss';

const PRODUCTS_PER_PAGE = 12;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';

  // ── Local state ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync category from URL
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
    setPage(1);
  }, [categoryFromUrl]);

  // ── API queries ─────────────────────────────────────────────────
  useGetCategoriesQuery();
  const { data: productsResponse, isFetching } = useGetProductsQuery({
    page,
    limit: PRODUCTS_PER_PAGE,
    search: search.trim(),
    category: selectedCategory,
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

  // Find active category name for breadcrumb
  const activeCategoryName = useMemo(() => {
    if (!selectedCategory) return '';
    const cat = categoryList.find((c) => (c._id || c.id) === selectedCategory);
    return cat?.catagoryName || cat?.name || '';
  }, [selectedCategory, categoryList]);

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
    setPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || search.trim();

  return (
    <div className="shop-page">
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
              <div className="shop-page__toolbar-right">
                <select
                  className="shop-page__sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
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
                    const category = product.category?.catagoryName || product.category?.name || '';

                    return (
                      <div className="shop-product-card" key={product._id || product.id}>
                        {discount > 0 && (
                          <span className="shop-product-card__badge">-{discount}%</span>
                        )}
                        {product.newArrival && (
                          <span className="shop-product-card__badge shop-product-card__badge--new">NEW</span>
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
                        </div>
                        <Link to={`/product/${product._id || product.id}`} className="shop-product-card__info">
                          {category && <span className="shop-product-card__category">{category}</span>}
                          <h3 className="shop-product-card__name">{name}</h3>
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
