import { useState } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * ProductFilters
 *
 * Props:
 *  filters      {Object}   Current filter state
 *  categories   {Array}    Category list for dropdown
 *  onChange      {fn}       Called with updated filters
 *  onReset       {fn}       Called to reset all filters
 *  activeCount   {number}   Number of active filters (for badge)
 */
const ProductFilters = ({ filters, categories = [], onChange, onReset, activeCount = 0 }) => {
  const [open, setOpen] = useState(false);

  const update = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="product-filters">
      {/* Toggle button */}
      <button
        className={`product-filters__toggle ${open ? 'product-filters__toggle--active' : ''}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <FiFilter />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="product-filters__badge">{activeCount}</span>
        )}
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {/* Filter panel */}
      {open && (
        <div className="product-filters__panel">
          <div className="product-filters__grid">

            {/* Category */}
            <div className="product-filters__field">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.catagoryName || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div className="product-filters__field">
              <label>Min Price</label>
              <input
                type="number"
                placeholder="₹ 0"
                min="0"
                value={filters.minPrice}
                onChange={(e) => update('minPrice', e.target.value)}
              />
            </div>

            {/* Max Price */}
            <div className="product-filters__field">
              <label>Max Price</label>
              <input
                type="number"
                placeholder="₹ 9999"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => update('maxPrice', e.target.value)}
              />
            </div>

            {/* Featured */}
            <div className="product-filters__field">
              <label>Featured</label>
              <select
                value={filters.featured}
                onChange={(e) => update('featured', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* New Arrival */}
            <div className="product-filters__field">
              <label>New Arrival</label>
              <select
                value={filters.newArrival}
                onChange={(e) => update('newArrival', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Best Seller */}
            <div className="product-filters__field">
              <label>Best Seller</label>
              <select
                value={filters.bestSeller}
                onChange={(e) => update('bestSeller', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

          </div>

          {/* Reset button */}
          {activeCount > 0 && (
            <button
              className="product-filters__reset"
              onClick={onReset}
              type="button"
            >
              <FiX /> Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
