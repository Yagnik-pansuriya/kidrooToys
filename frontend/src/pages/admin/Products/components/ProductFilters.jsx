import { useState } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * ProductFilters
 *
 * Props:
 *  filters      {Object}   Current filter state
 *  categories   {Array}    Category list for dropdown
 *  skills       {Array}    Skills list for dropdown
 *  onChange      {fn}       Called with updated filters
 *  onReset       {fn}       Called to reset all filters
 *  activeCount   {number}   Number of active filters (for badge)
 */
const ProductFilters = ({ filters, categories = [], skills = [], onChange, onReset, activeCount = 0 }) => {
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

            {/* Price Range */}
            <div className="product-filters__field">
              <label>Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => update('priceRange', e.target.value)}
              >
                <option value="">All Prices</option>
                <option value="under499">Under ₹499</option>
                <option value="under999">Under ₹999</option>
                <option value="above1000">Above ₹1000</option>
              </select>
            </div>

            {/* Age Group */}
            <div className="product-filters__field">
              <label>Age Group</label>
              <select
                value={filters.ageRange}
                onChange={(e) => update('ageRange', e.target.value)}
              >
                <option value="">All Ages</option>
                <option value="0-2">0–2 years</option>
                <option value="2-4">2–4 years</option>
                <option value="4-6">4–6 years</option>
                <option value="6-8">6–8 years</option>
                <option value="8+">8+ years</option>
              </select>
            </div>

            {/* Skills */}
            <div className="product-filters__field">
              <label>Skill</label>
              <select
                value={filters.skill}
                onChange={(e) => update('skill', e.target.value)}
              >
                <option value="">All Skills</option>
                {skills.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
