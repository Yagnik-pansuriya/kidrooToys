import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiUsers, FiUser, FiShoppingBag, FiTrendingUp,
  FiFilter, FiChevronLeft, FiChevronRight, FiEye,
  FiToggleLeft, FiToggleRight, FiRepeat
} from 'react-icons/fi';
import { MdVerified, MdBlock } from 'react-icons/md';
import { useGetAllAdminCustomersQuery, useToggleAdminCustomerStatusMutation } from '../../../store/ActionApi/adminCustomerApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './AdminCustomers.scss';

// ── Filter configs ───────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',        label: 'All',          icon: <FiUsers /> },
  { key: 'active',     label: 'Active',       icon: <FiToggleRight /> },
  { key: 'inactive',   label: 'Inactive',     icon: <FiToggleLeft /> },
  { key: 'verified',   label: 'Verified',     icon: <MdVerified /> },
  { key: 'repeat',     label: 'Repeat Buyers',icon: <FiRepeat /> },
  { key: 'high_value', label: 'High Value',   icon: <FiTrendingUp /> },
];

const SORTS = [
  { key: 'newest',      label: 'Newest First' },
  { key: 'oldest',      label: 'Oldest First' },
  { key: 'most_orders', label: 'Most Orders' },
  { key: 'most_spent',  label: 'Most Spent' },
  { key: 'last_active', label: 'Last Active' },
];

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AdminCustomers = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState('newest');
  const [page, setPage]         = useState(1);
  const LIMIT = 15;

  const { data, isLoading, isFetching } = useGetAllAdminCustomersQuery(
    { search, filter, sort, page, limit: LIMIT },
    { refetchOnMountOrArgChange: true }
  );

  const [toggleStatus, { isLoading: isToggling }] = useToggleAdminCustomerStatusMutation();

  const customers   = data?.data?.customers || [];
  const pagination  = data?.data?.pagination || {};

  // Debounce search — only fire API after user stops typing
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  };
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (e.target.value === '') {
      setSearch('');
      setPage(1);
    }
  };

  const handleFilterChange = useCallback((key) => {
    setFilter(key);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSort(e.target.value);
    setPage(1);
  }, []);

  const handleToggleStatus = async (e, customerId) => {
    e.stopPropagation();
    try {
      const res = await toggleStatus(customerId).unwrap();
      showSuccess(res.message || 'Status updated');
    } catch (err) {
      showError(err?.data?.message || 'Failed to update status');
    }
  };

  // Summary stats from current page data
  const summaryStats = useMemo(() => {
    const total = pagination.total || 0;
    const active = customers.filter(c => c.isActive).length;
    const verified = customers.filter(c => c.isVerified).length;
    const repeat = customers.filter(c => c.totalOrders > 1).length;
    return { total, active, verified, repeat };
  }, [customers, pagination]);

  if (isLoading) return <Loader inline message="Loading Customers…" />;

  return (
    <div className="admin-customers">
      {/* ── Header ── */}
      <div className="admin-customers__header">
        <div>
          <h1>Customers 👥</h1>
          <p className="admin-customers__subtitle">
            {pagination.total || 0} total customers registered
          </p>
        </div>
        {/* Search */}
        <div className="admin-customers__search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email or mobile… (Enter)"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            id="customer-search-input"
          />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="ac-stats">
        <div className="ac-stat-card ac-stat-card--blue">
          <FiUsers className="ac-stat-card__icon" />
          <div>
            <span className="ac-stat-card__val">{pagination.total || 0}</span>
            <span className="ac-stat-card__label">Total Customers</span>
          </div>
        </div>
        <div className="ac-stat-card ac-stat-card--green">
          <FiToggleRight className="ac-stat-card__icon" />
          <div>
            <span className="ac-stat-card__val">{summaryStats.active}</span>
            <span className="ac-stat-card__label">Active (this page)</span>
          </div>
        </div>
        <div className="ac-stat-card ac-stat-card--purple">
          <MdVerified className="ac-stat-card__icon" />
          <div>
            <span className="ac-stat-card__val">{summaryStats.verified}</span>
            <span className="ac-stat-card__label">Verified (this page)</span>
          </div>
        </div>
        <div className="ac-stat-card ac-stat-card--orange">
          <FiRepeat className="ac-stat-card__icon" />
          <div>
            <span className="ac-stat-card__val">{summaryStats.repeat}</span>
            <span className="ac-stat-card__label">Repeat Buyers (this page)</span>
          </div>
        </div>
      </div>

      {/* ── Filters + Sort Row ── */}
      <div className="admin-customers__toolbar">
        <div className="admin-customers__filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`ac-filter-btn ${filter === f.key ? 'ac-filter-btn--active' : ''}`}
              onClick={() => handleFilterChange(f.key)}
              id={`customer-filter-${f.key}`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
        <div className="admin-customers__sort">
          <FiFilter />
          <select value={sort} onChange={handleSortChange} id="customer-sort-select">
            {SORTS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {isFetching && <div className="ac-fetching-bar" />}

      {customers.length === 0 ? (
        <div className="admin-customers__empty">
          <FiUser />
          <p>No customers found</p>
          {(search || filter !== 'all') && (
            <button className="ac-clear-btn" onClick={() => { setSearch(''); setSearchInput(''); setFilter('all'); setPage(1); }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="admin-customers__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, idx) => (
                <tr
                  key={customer._id}
                  className="admin-table__row--clickable"
                  onClick={() => navigate(`/admin/customers/${customer._id}`)}
                >
                  <td className="ac-td-num">{(page - 1) * LIMIT + idx + 1}</td>
                  <td>
                    <div className="ac-customer-cell">
                      <div className="ac-avatar">
                        {customer.avatar
                          ? <img src={customer.avatar} alt={customer.firstName} />
                          : <span>{(customer.firstName?.[0] || 'C').toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <span className="ac-customer-name">
                          {customer.firstName} {customer.lastName}
                          {customer.isVerified && (
                            <MdVerified className="ac-verified-icon" title="Verified" />
                          )}
                        </span>
                        <span className="ac-customer-email">{customer.email || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="ac-mobile">+91 {customer.mobile}</td>
                  <td>
                    <div className="ac-orders-cell">
                      <FiShoppingBag />
                      <span className={`ac-order-count ${customer.totalOrders > 1 ? 'ac-order-count--repeat' : ''}`}>
                        {customer.totalOrders}
                      </span>
                      {customer.totalOrders > 1 && (
                        <span className="ac-repeat-badge">Repeat</span>
                      )}
                    </div>
                  </td>
                  <td className="ac-spent">{fmt(customer.totalSpent)}</td>
                  <td className="ac-date">{fmtDate(customer.lastOrderDate)}</td>
                  <td className="ac-date">{fmtDate(customer.createdAt)}</td>
                  <td>
                    <span className={`ac-status-badge ${customer.isActive ? 'ac-status-badge--active' : 'ac-status-badge--inactive'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="ac-actions">
                      <button
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => navigate(`/admin/customers/${customer._id}`)}
                        title="View Details"
                        id={`customer-view-${customer._id}`}
                      >
                        <FiEye />
                      </button>
                      <button
                        className={`admin-action-btn ${customer.isActive ? 'admin-action-btn--danger' : 'admin-action-btn--success'}`}
                        onClick={(e) => handleToggleStatus(e, customer._id)}
                        disabled={isToggling}
                        title={customer.isActive ? 'Deactivate' : 'Activate'}
                        id={`customer-toggle-${customer._id}`}
                      >
                        {customer.isActive ? <MdBlock /> : <FiToggleRight />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="ac-pagination">
          <button
            className="ac-page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            id="customer-prev-page"
          >
            <FiChevronLeft /> Prev
          </button>
          <div className="ac-page-info">
            Page <strong>{page}</strong> of <strong>{pagination.pages}</strong>
            <span className="ac-page-total">({pagination.total} customers)</span>
          </div>
          <button
            className="ac-page-btn"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            id="customer-next-page"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
