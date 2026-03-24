import { FiSearch, FiX } from 'react-icons/fi';

/**
 * ProductSearchBar
 *
 * Props:
 *  searchInput   {string}   Controlled value of the text input
 *  searchQuery   {string}   Currently active search (shows notice pill)
 *  onInputChange {fn}       Called on keystroke
 *  onSubmit      {fn}       Called when form is submitted (Enter / button)
 *  onClear       {fn}       Called when × or "Clear" is clicked
 */
const ProductSearchBar = ({ searchInput, searchQuery, onInputChange, onSubmit, onClear }) => (
  <div>
    {/* ── Search form ── */}
    <form className="admin-products__search-bar" onSubmit={onSubmit}>
      <div className="admin-products__search-input-wrap">
        <FiSearch className="admin-products__search-icon" aria-hidden="true" />

        <input
          id="product-search"
          type="text"
          className="admin-products__search-input"
          placeholder="Search by name, category, tags…"
          value={searchInput}
          onChange={(e) => onInputChange(e.target.value)}
          autoComplete="off"
        />

        {searchInput && (
          <button
            type="button"
            className="admin-products__search-clear"
            onClick={onClear}
            aria-label="Clear search"
            title="Clear"
          >
            <FiX />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="admin-btn admin-btn--primary admin-products__search-btn"
      >
        Search
      </button>
    </form>

    {/* ── Active search notice ── */}
    {searchQuery && (
      <div className="admin-products__search-notice" role="status">
        Showing results for <strong>"{searchQuery}"</strong>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
    )}
  </div>
);

export default ProductSearchBar;
