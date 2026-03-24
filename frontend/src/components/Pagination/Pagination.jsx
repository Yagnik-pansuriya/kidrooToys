import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import './Pagination.scss';

/**
 * Reusable Pagination Component
 *
 * Props:
 *  - currentPage  {number}   Current active page (1-indexed)
 *  - totalPages   {number}   Total number of pages
 *  - totalItems   {number}   Total number of items (optional, for display)
 *  - limit        {number}   Items per page (optional, for display)
 *  - onPageChange {function} Called with the new page number
 *  - className    {string}   Extra class (optional)
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  limit,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const goTo = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  // Build visible page numbers with ellipsis
  const getPages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');

    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    // Deduplicate
    const seen = new Set();
    for (const r of range) {
      if (!seen.has(r)) { seen.add(r); rangeWithDots.push(r); }
    }
    return rangeWithDots;
  };

  const pages = getPages();

  const startItem = totalItems != null && limit != null
    ? (currentPage - 1) * limit + 1
    : null;
  const endItem = totalItems != null && limit != null
    ? Math.min(currentPage * limit, totalItems)
    : null;

  return (
    <div className={`pagination-wrap ${className}`}>
      {/* Item count info */}
      {totalItems != null && (
        <span className="pagination-info">
          Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> items
        </span>
      )}

      <nav className="pagination" aria-label="Pagination">
        {/* First page */}
        <button
          className="pagination__btn"
          onClick={() => goTo(1)}
          disabled={currentPage === 1}
          title="First page"
          aria-label="Go to first page"
        >
          <FiChevronsLeft />
        </button>

        {/* Previous */}
        <button
          className="pagination__btn"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
          aria-label="Go to previous page"
        >
          <FiChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="pagination__dots">…</span>
          ) : (
            <button
              key={page}
              className={`pagination__btn pagination__btn--page ${page === currentPage ? 'pagination__btn--active' : ''}`}
              onClick={() => goTo(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          className="pagination__btn"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
          aria-label="Go to next page"
        >
          <FiChevronRight />
        </button>

        {/* Last page */}
        <button
          className="pagination__btn"
          onClick={() => goTo(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
          aria-label="Go to last page"
        >
          <FiChevronsRight />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
