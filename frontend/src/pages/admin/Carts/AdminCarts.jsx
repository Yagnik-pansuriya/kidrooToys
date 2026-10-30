import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiShoppingCart, FiPackage, FiTrendingUp, FiClock,
  FiChevronLeft, FiChevronRight, FiEye, FiX,
} from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import {
  useGetAdminCartSummaryQuery,
  useGetAllAdminCartsQuery,
} from '../../../store/ActionApi/cartApi';
import Loader from '../../../components/Loader/Loader';
import './AdminCarts.scss';

// ── Constants ─────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: 'All Carts' },
  { key: 'active',    label: 'Active (24h)' },
  { key: 'abandoned', label: 'Abandoned' },
];

const SORTS = [
  { key: 'recent',        label: 'Recently Updated' },
  { key: 'oldest',        label: 'Oldest Updated' },
  { key: 'highest_value', label: 'Highest Value' },
  { key: 'most_items',    label: 'Most Items' },
];

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const timeAgo = (d) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const AdminCarts = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: summaryData } = useGetAdminCartSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data, isLoading, isFetching } = useGetAllAdminCartsQuery(
    { search, filter, sort, page, limit: PAGE_SIZE },
    { refetchOnMountOrArgChange: true }
  );

  const summary = summaryData?.data || {};
  const carts = data?.data?.carts || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="acart-page">
      {/* ── Header ── */}
      <div className="acart-header">
        <div>
          <h1><FiShoppingCart /> Customer Carts</h1>
          <p className="acart-subtitle">
            Products logged-in customers have added to their cart but not ordered yet
          </p>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="acart-kpis">
        <div className="acart-kpi acart-kpi--blue">
          <FiShoppingCart />
          <div>
            <span className="acart-kpi__value">{summary.totalCarts || 0}</span>
            <span className="acart-kpi__label">Carts with items</span>
          </div>
        </div>
        <div className="acart-kpi acart-kpi--green">
          <FiTrendingUp />
          <div>
            <span className="acart-kpi__value">{fmt(summary.totalValue)}</span>
            <span className="acart-kpi__label">Total cart value</span>
          </div>
        </div>
        <div className="acart-kpi acart-kpi--purple">
          <FiPackage />
          <div>
            <span className="acart-kpi__value">{summary.totalQuantity || 0}</span>
            <span className="acart-kpi__label">Units in carts · avg {fmt(summary.avgCartValue)}</span>
          </div>
        </div>
        <div className="acart-kpi acart-kpi--amber">
          <FiClock />
          <div>
            <span className="acart-kpi__value">{summary.abandonedCarts || 0}</span>
            <span className="acart-kpi__label">Abandoned (&gt;24h idle)</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="acart-toolbar">
        <div className="acart-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, mobile or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            id="admin-carts-search"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} aria-label="Clear search"><FiX /></button>
          )}
        </div>

        <div className="acart-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`acart-filter ${filter === f.key ? 'acart-filter--active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="acart-sort"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          id="admin-carts-sort"
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className={`acart-table-wrap ${isFetching && !isLoading ? 'acart-table-wrap--fetching' : ''}`}>
        {isLoading ? (
          <Loader inline message="Loading carts…" />
        ) : carts.length === 0 ? (
          <div className="acart-empty">
            <FiShoppingCart />
            <p>{search || filter !== 'all' ? 'No carts match your filters' : 'No customer has items in their cart right now'}</p>
          </div>
        ) : (
          <table className="acart-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Products</th>
                <th className="acart-td-num">Items</th>
                <th className="acart-td-num">Qty</th>
                <th className="acart-td-num">Cart Value</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart) => {
                const c = cart.customer || {};
                const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer';
                return (
                  <tr
                    key={cart._id}
                    className="acart-row"
                    onClick={() => navigate(`/admin/carts/${c._id}`)}
                  >
                    <td>
                      <div className="acart-customer">
                        <div className="acart-avatar">
                          {c.avatar ? <img src={c.avatar} alt={fullName} /> : (c.firstName?.[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <span className="acart-customer__name">
                            {fullName}
                            {c.isVerified && <MdVerified className="acart-verified" title="Verified" />}
                          </span>
                          <span className="acart-customer__meta">+91 {c.mobile}</span>
                          {c.email && <span className="acart-customer__meta">{c.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="acart-thumbs">
                        {cart.preview?.map((p, i) => (
                          p.image
                            ? <img key={i} src={p.image} alt={p.name} title={p.name} />
                            : <span key={i} className="acart-thumbs__ph" title={p.name}><FiPackage /></span>
                        ))}
                        {cart.itemCount > (cart.preview?.length || 0) && (
                          <span className="acart-thumbs__more">+{cart.itemCount - cart.preview.length}</span>
                        )}
                      </div>
                    </td>
                    <td className="acart-td-num">{cart.itemCount}</td>
                    <td className="acart-td-num">{cart.totalQuantity}</td>
                    <td className="acart-td-num acart-value">{fmt(cart.cartValue)}</td>
                    <td className="acart-date" title={new Date(cart.updatedAt).toLocaleString('en-IN')}>
                      {timeAgo(cart.updatedAt)}
                    </td>
                    <td>
                      <span className={`acart-badge ${cart.isAbandoned ? 'acart-badge--amber' : 'acart-badge--green'}`}>
                        {cart.isAbandoned ? 'Abandoned' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="acart-view-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/carts/${c._id}`); }}
                        title="View cart details"
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="acart-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
            <FiChevronLeft />
          </button>
          <span>Page {pagination.page} of {pagination.pages} · {pagination.total} carts</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCarts;
