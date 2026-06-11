import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiUsers, FiUser, FiShoppingBag, FiTrendingUp,
  FiFilter, FiChevronLeft, FiChevronRight, FiEye,
  FiToggleLeft, FiToggleRight, FiRepeat, FiArrowUp,
  FiMessageSquare, FiSend, FiX, FiTrash2, FiCheckSquare,
  FiAlertCircle, FiPlus,
} from 'react-icons/fi';
import { RiVipCrownLine, RiVipDiamondLine } from 'react-icons/ri';
import { MdVerified, MdBlock, MdCampaign } from 'react-icons/md';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import {
  useGetAdminCustomerSummaryQuery,
  useGetAllAdminCustomersQuery,
  useToggleAdminCustomerStatusMutation,
} from '../../../store/ActionApi/adminCustomerApi';
import {
  useGetSmsCampaignStatsQuery,
  useGetAllSmsCampaignsQuery,
  useCreateSmsCampaignMutation,
  useDeleteSmsCampaignMutation,
} from '../../../store/ActionApi/adminSmsCampaignApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './AdminCustomers.scss';

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',        label: 'All',           icon: <FiUsers /> },
  { key: 'active',     label: 'Active',        icon: <FiToggleRight /> },
  { key: 'inactive',   label: 'Inactive',      icon: <FiToggleLeft /> },
  { key: 'verified',   label: 'Verified',      icon: <MdVerified /> },
  { key: 'repeat',     label: 'Repeat Buyers', icon: <FiRepeat /> },
  { key: 'high_value', label: 'High Value',    icon: <FiTrendingUp /> },
];

const SORTS = [
  { key: 'newest',      label: 'Newest First' },
  { key: 'oldest',      label: 'Oldest First' },
  { key: 'most_orders', label: 'Most Orders' },
  { key: 'most_spent',  label: 'Most Spent' },
  { key: 'last_active', label: 'Last Active' },
];

// Quick-select shortcut groups (for bulk selection)
const QUICK_GROUPS = [
  { key: 'all',        label: 'All Active',    color: '#6366F1' },
  { key: 'high_value', label: 'VIP',           color: '#F59E0B' },
  { key: 'repeat',     label: 'Repeat Buyers', color: '#8B5CF6' },
  { key: 'new',        label: 'New (Month)',   color: '#14B8A6' },
  { key: 'at_risk',    label: 'At Risk',       color: '#EF4444' },
];

const TARGET_OPTIONS = [
  { key: 'all',        label: 'All Customers' },
  { key: 'high_value', label: 'VIP Customers (High Value)' },
  { key: 'repeat',     label: 'Repeat Buyers' },
  { key: 'new',        label: 'New This Month' },
  { key: 'at_risk',    label: 'At-Risk Customers (90+ days inactive)' },
  { key: 'custom',     label: 'Selected Customers Only' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

// Determine customer type badge
const getCustomerType = (c) => {
  if (c.totalSpent >= 2000 || (c.totalOrders >= 5 && c.totalSpent >= 1000)) return 'vip';
  if (c.totalOrders > 1) return 'repeat';
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (new Date(c.createdAt) >= thirtyDaysAgo) return 'new';
  return 'regular';
};

const TYPE_BADGE = {
  vip:     { label: 'VIP',     cls: 'ac-type--vip' },
  repeat:  { label: 'Repeat',  cls: 'ac-type--repeat' },
  new:     { label: 'New',     cls: 'ac-type--new' },
  regular: { label: 'Regular', cls: 'ac-type--regular' },
};

// Campaign emoji icons
const CAMPAIGN_ICONS = ['🎉', '🛍️', '🎊', '⭐', '🔥', '💎', '🎁', '🚀'];

// ── SMS Send Modal ────────────────────────────────────────────────────────────
const SmsModal = ({ selectedIds, selectedCount, onClose, onSent }) => {
  const { showSuccess, showError } = useToast();
  const [campaignName, setCampaignName]   = useState('');
  const [message, setMessage]             = useState('');
  const [targetGroup, setTargetGroup]     = useState('custom');
  const [createCampaign, { isLoading }]   = useCreateSmsCampaignMutation();

  const charCount = message.length;
  const isOverLimit = charCount > 160;

  const handleSend = async () => {
    if (!campaignName.trim()) { showError('Campaign name is required'); return; }
    if (!message.trim())      { showError('Message is required'); return; }
    if (isOverLimit)          { showError('Message exceeds 160 characters'); return; }
    try {
      const body = {
        name: campaignName,
        message,
        targetGroup,
        targetIds: targetGroup === 'custom' ? selectedIds : [],
      };
      const res = await createCampaign(body).unwrap();
      showSuccess(res.message || 'Campaign sent!');
      onSent();
    } catch (err) {
      showError(err?.data?.message || 'Failed to send campaign');
    }
  };

  return (
    <div className="sms-modal-overlay" onClick={onClose}>
      <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-modal__header">
          <div className="sms-modal__title-row">
            <FiMessageSquare className="sms-modal__icon" />
            <div>
              <h2>New SMS Campaign</h2>
              <p>{selectedCount > 0 ? `${selectedCount} customers selected` : 'Choose a target group'}</p>
            </div>
          </div>
          <button className="sms-modal__close" onClick={onClose}><FiX /></button>
        </div>

        <div className="sms-modal__body">
          {/* Campaign Name */}
          <div className="sms-modal__field">
            <label htmlFor="campaign-name">Campaign Name</label>
            <input
              id="campaign-name"
              type="text"
              placeholder="e.g. Summer Sale 2026"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          {/* Target Group */}
          <div className="sms-modal__field">
            <label htmlFor="campaign-target">Target Audience</label>
            <select
              id="campaign-target"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              {TARGET_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            {targetGroup === 'custom' && selectedCount === 0 && (
              <span className="sms-modal__warn">
                <FiAlertCircle /> Select customers from the table first
              </span>
            )}
            {targetGroup === 'custom' && selectedCount > 0 && (
              <span className="sms-modal__info">
                ✓ Will send to {selectedCount} selected customers
              </span>
            )}
          </div>

          {/* Message */}
          <div className="sms-modal__field">
            <label htmlFor="campaign-msg">
              Message
              <span className={`sms-modal__char ${isOverLimit ? 'sms-modal__char--over' : ''}`}>
                {charCount}/160
              </span>
            </label>
            <textarea
              id="campaign-msg"
              rows={4}
              placeholder="Hi {name}, Exciting offer from Kidroo Toys! Get 20% off on all toys this weekend. Shop now: kidrootoys.com"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {isOverLimit && (
              <span className="sms-modal__warn"><FiAlertCircle /> Message is too long — will be split into 2 SMS</span>
            )}
          </div>

          {/* Preview */}
          {message.trim() && (
            <div className="sms-modal__preview">
              <span className="sms-modal__preview-label">Preview</span>
              <div className="sms-modal__bubble">{message}</div>
            </div>
          )}
        </div>

        <div className="sms-modal__footer">
          <button className="sms-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sms-modal__btn-send"
            onClick={handleSend}
            disabled={isLoading || !message.trim() || !campaignName.trim()}
            id="campaign-send-btn"
          >
            {isLoading ? 'Sending…' : <><FiSend /> Send Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SMS Campaigns Tab ─────────────────────────────────────────────────────────
const SmsCampaignsTab = ({ onNewCampaign }) => {
  const { showSuccess, showError } = useToast();
  const { data: statsData } = useGetSmsCampaignStatsQuery();
  const { data: campaignsData, isLoading } = useGetAllSmsCampaignsQuery();
  const [deleteCampaign] = useDeleteSmsCampaignMutation();

  const stats     = statsData?.data || {};
  const campaigns = campaignsData?.data || [];

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete campaign "${name}"?`)) return;
    try {
      await deleteCampaign(id).unwrap();
      showSuccess('Campaign deleted');
    } catch {
      showError('Failed to delete campaign');
    }
  };

  if (isLoading) return <Loader inline message="Loading campaigns…" />;

  return (
    <div className="sms-tab">

      {/* ── Campaign KPI Cards ── */}
      <div className="sms-kpi-row">
        <div className="sms-kpi-card" id="sms-kpi-total-sent">
          <div className="sms-kpi-card__body">
            <span className="sms-kpi-card__title">TOTAL SENT</span>
            <span className="sms-kpi-card__value">{(stats.totalSent || 0).toLocaleString('en-IN')}</span>
            <span className="sms-kpi-card__sub">All campaigns</span>
          </div>
          <div className="sms-kpi-card__sep sms-kpi-card__sep--blue" />
        </div>
        <div className="sms-kpi-card" id="sms-kpi-delivered">
          <div className="sms-kpi-card__body">
            <span className="sms-kpi-card__title">DELIVERED</span>
            <span className="sms-kpi-card__value sms-kpi-card__value--teal">{(stats.totalDelivered || 0).toLocaleString('en-IN')}</span>
            <span className="sms-kpi-card__sub">{stats.deliveryRate || 0}% rate</span>
          </div>
          <div className="sms-kpi-card__sep sms-kpi-card__sep--teal" />
        </div>
        <div className="sms-kpi-card" id="sms-kpi-failed">
          <div className="sms-kpi-card__body">
            <span className="sms-kpi-card__title">FAILED</span>
            <span className="sms-kpi-card__value sms-kpi-card__value--red">{(stats.totalFailed || 0).toLocaleString('en-IN')}</span>
            <span className="sms-kpi-card__sub">Delivery failures</span>
          </div>
          <div className="sms-kpi-card__sep sms-kpi-card__sep--red" />
        </div>
        <div className="sms-kpi-card" id="sms-kpi-campaigns">
          <div className="sms-kpi-card__body">
            <span className="sms-kpi-card__title">CAMPAIGNS RUN</span>
            <span className="sms-kpi-card__value sms-kpi-card__value--purple">{stats.thisMonthCount || 0}</span>
            <span className="sms-kpi-card__sub">This month</span>
          </div>
          <div className="sms-kpi-card__sep sms-kpi-card__sep--purple" />
        </div>
      </div>

      {/* ── New Campaign button ── */}
      <div className="sms-tab__actions">
        <button className="sms-new-btn" onClick={onNewCampaign} id="new-campaign-btn">
          <FiPlus /> New Campaign
        </button>
      </div>

      {/* ── Campaign List ── */}
      {campaigns.length === 0 ? (
        <div className="sms-empty">
          <MdCampaign />
          <p>No campaigns yet</p>
          <span>Create your first campaign to start engaging customers</span>
          <button className="sms-new-btn" onClick={onNewCampaign}>
            <FiPlus /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="sms-campaign-list">
          {campaigns.map((c, idx) => {
            const rate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
            const icon = CAMPAIGN_ICONS[idx % CAMPAIGN_ICONS.length];
            return (
              <div className="sms-campaign-row" key={c._id} id={`campaign-${c._id}`}>
                <div className="sms-campaign-row__icon">{icon}</div>
                <div className="sms-campaign-row__info">
                  <div className="sms-campaign-row__name">
                    {c.name}
                    <span className={`sms-status-dot sms-status-dot--${c.status}`}>
                      • {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                  <div className="sms-campaign-row__meta">
                    {c.targetLabel} · {fmtShort(c.sentAt || c.createdAt)}
                  </div>
                </div>
                <div className="sms-campaign-row__stats">
                  <div className="sms-stat-col">
                    <span className="sms-stat-col__val">{c.sentCount.toLocaleString('en-IN')}</span>
                    <span className="sms-stat-col__lbl">Sent</span>
                  </div>
                  <div className="sms-stat-col sms-stat-col--green">
                    <span className="sms-stat-col__val">{c.deliveredCount.toLocaleString('en-IN')}</span>
                    <span className="sms-stat-col__lbl">Delivered</span>
                  </div>
                  <div className="sms-stat-col sms-stat-col--red">
                    <span className="sms-stat-col__val">{c.failedCount.toLocaleString('en-IN')}</span>
                    <span className="sms-stat-col__lbl">Failed</span>
                  </div>
                  <div className="sms-stat-col sms-stat-col--rate">
                    <span className="sms-stat-col__val">{rate}%</span>
                    <span className="sms-stat-col__lbl">Rate</span>
                  </div>
                </div>
                <button
                  className="sms-campaign-row__del"
                  onClick={() => handleDelete(c._id, c.name)}
                  title="Delete campaign"
                  id={`del-campaign-${c._id}`}
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminCustomers = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Tab
  const [activeTab, setActiveTab] = useState('customers');

  // Customers list state
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter]           = useState('all');
  const [sort, setSort]               = useState('newest');
  const [page, setPage]               = useState(1);
  const LIMIT = 15;

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal state
  const [showSmsModal, setShowSmsModal] = useState(false);

  // ── Data ──
  const { data: summaryData } = useGetAdminCustomerSummaryQuery();
  const summary = summaryData?.data || {};

  const { data, isLoading, isFetching } = useGetAllAdminCustomersQuery(
    { search, filter, sort, page, limit: LIMIT },
    { refetchOnMountOrArgChange: true }
  );

  const [toggleStatus, { isLoading: isToggling }] = useToggleAdminCustomerStatusMutation();

  const customers  = data?.data?.customers || [];
  const pagination = data?.data?.pagination || {};

  // ── Derived ──
  const allPageIds    = useMemo(() => customers.map(c => c._id), [customers]);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
  const somePageSelected = allPageIds.some(id => selectedIds.has(id));

  // ── Handlers ──
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
  };
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (e.target.value === '') { setSearch(''); setPage(1); }
  };
  const handleFilterChange = useCallback((key) => { setFilter(key); setPage(1); setSelectedIds(new Set()); }, []);
  const handleSortChange   = useCallback((e)   => { setSort(e.target.value); setPage(1); }, []);

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const n = new Set(prev); allPageIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); allPageIds.forEach(id => n.add(id)); return n; });
    }
  };

  const toggleSelectOne = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Quick-group shortcuts: select current page customers matching the group
  const handleQuickGroup = (groupKey) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const matching = customers.filter(c => {
      if (!c.isActive) return false;
      if (groupKey === 'all')        return true;
      if (groupKey === 'high_value') return c.totalSpent >= 1000;
      if (groupKey === 'repeat')     return c.totalOrders > 1;
      if (groupKey === 'new')        return new Date(c.createdAt) >= thirtyDaysAgo;
      if (groupKey === 'at_risk') {
        const last = c.lastOrderDate ? new Date(c.lastOrderDate) : null;
        return c.totalOrders > 0 && (!last || last < ninetyDaysAgo);
      }
      return false;
    });

    setSelectedIds(prev => {
      const n = new Set(prev);
      matching.forEach(c => n.add(c._id));
      return n;
    });
  };

  const handleToggleStatus = async (e, customerId) => {
    e.stopPropagation();
    try {
      const res = await toggleStatus(customerId).unwrap();
      showSuccess(res.message || 'Status updated');
    } catch (err) {
      showError(err?.data?.message || 'Failed to update status');
    }
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleSmsModalClose  = () => setShowSmsModal(false);
  const handleSmsSent        = () => { setShowSmsModal(false); setActiveTab('sms'); };

  if (isLoading && activeTab === 'customers') return <Loader inline message="Loading Customers…" />;

  return (
    <div className="admin-customers">

      {/* ── Page Tabs ── */}
      <div className="ac-tabs">
        <button
          className={`ac-tab ${activeTab === 'customers' ? 'ac-tab--active' : ''}`}
          onClick={() => setActiveTab('customers')}
          id="tab-customers"
        >
          <FiUsers /> Customers
        </button>
        <button
          className={`ac-tab ${activeTab === 'sms' ? 'ac-tab--active' : ''}`}
          onClick={() => setActiveTab('sms')}
          id="tab-sms-campaigns"
        >
          <MdCampaign /> SMS Campaigns
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          CUSTOMERS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'customers' && (
        <>
          {/* ── Header ── */}
          <div className="admin-customers__header">
            <div>
              <h1>Customers 👥</h1>
              <p className="admin-customers__subtitle">
                {pagination.total || 0} total customers registered
              </p>
            </div>
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

          {/* ── KPI Stats Row ── */}
          <div className="ac-kpi-row">
            <div className="ac-kpi-card" id="kpi-total-customers">
              <div className="ac-kpi-card__body">
                <span className="ac-kpi-card__title">TOTAL CUSTOMERS</span>
                <span className="ac-kpi-card__value">{summary.total ?? 0}</span>
                <span className="ac-kpi-card__sub ac-kpi-card__sub--up">
                  <FiArrowUp />{summary.newThisMonth ?? 0} this month
                </span>
              </div>
              <div className="ac-kpi-card__sep ac-kpi-card__sep--blue" />
            </div>
            <div className="ac-kpi-card" id="kpi-new-this-month">
              <div className="ac-kpi-card__body">
                <span className="ac-kpi-card__title">NEW THIS MONTH</span>
                <span className="ac-kpi-card__value ac-kpi-card__value--teal">{summary.newThisMonth ?? 0}</span>
                <span className="ac-kpi-card__sub">First purchase</span>
              </div>
              <div className="ac-kpi-card__sep ac-kpi-card__sep--teal" />
            </div>
            <div className="ac-kpi-card" id="kpi-repeat-customers">
              <div className="ac-kpi-card__body">
                <span className="ac-kpi-card__title">REPEAT CUSTOMERS</span>
                <span className="ac-kpi-card__value ac-kpi-card__value--green">{summary.repeatCount ?? 0}</span>
                <span className="ac-kpi-card__sub">{summary.repeatRate ?? 0}% repeat rate</span>
              </div>
              <div className="ac-kpi-card__sep ac-kpi-card__sep--green" />
            </div>
            <div className="ac-kpi-card" id="kpi-avg-ltv">
              <div className="ac-kpi-card__body">
                <span className="ac-kpi-card__title">AVG. LTV</span>
                <span className="ac-kpi-card__value ac-kpi-card__value--purple">{fmt(summary.avgLTV)}</span>
                <span className="ac-kpi-card__sub">Per customer</span>
              </div>
              <div className="ac-kpi-card__sep ac-kpi-card__sep--purple" />
            </div>
          </div>

          {/* ── Quick-Select Shortcuts ── */}
          <div className="ac-shortcuts">
            <div className="ac-shortcuts__label">
              <HiOutlineLightningBolt /> Quick Select:
            </div>
            {QUICK_GROUPS.map(g => (
              <button
                key={g.key}
                className="ac-shortcut-btn"
                style={{ '--shortcut-color': g.color }}
                onClick={() => handleQuickGroup(g.key)}
                id={`shortcut-${g.key}`}
              >
                {g.label}
              </button>
            ))}
            {selectedIds.size > 0 && (
              <button className="ac-shortcut-clear" onClick={handleClearSelection}>
                <FiX /> Clear ({selectedIds.size})
              </button>
            )}
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
                  {f.icon}<span>{f.label}</span>
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

          {/* ── Fetching bar ── */}
          {isFetching && <div className="ac-fetching-bar" />}

          {/* ── Table ── */}
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
                    <th>
                      <label className="ac-checkbox" htmlFor="select-all-cb">
                        <input
                          type="checkbox"
                          id="select-all-cb"
                          checked={allPageSelected}
                          ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                          onChange={toggleSelectAll}
                        />
                        <span className="ac-checkbox__box" />
                      </label>
                    </th>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, idx) => {
                    const isSelected = selectedIds.has(customer._id);
                    const ctype = getCustomerType(customer);
                    const badge = TYPE_BADGE[ctype];
                    return (
                      <tr
                        key={customer._id}
                        className={`admin-table__row--clickable ${isSelected ? 'ac-row--selected' : ''}`}
                        onClick={() => navigate(`/admin/customers/${customer._id}`)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <label className="ac-checkbox" htmlFor={`cb-${customer._id}`}>
                            <input
                              type="checkbox"
                              id={`cb-${customer._id}`}
                              checked={isSelected}
                              onChange={(e) => toggleSelectOne(e, customer._id)}
                            />
                            <span className="ac-checkbox__box" />
                          </label>
                        </td>
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
                                {customer.isVerified && <MdVerified className="ac-verified-icon" title="Verified" />}
                              </span>
                              <span className="ac-customer-email">{customer.email || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="ac-mobile">
                          {customer.mobile
                            ? `${customer.mobile.slice(0, 5)} ${customer.mobile.slice(5)}`
                            : '—'
                          }
                        </td>
                        <td>
                          <div className="ac-orders-cell">
                            <FiShoppingBag />
                            <span className={`ac-order-count ${customer.totalOrders > 1 ? 'ac-order-count--repeat' : ''}`}>
                              {customer.totalOrders}
                            </span>
                            {customer.totalOrders > 1 && <span className="ac-repeat-badge">Repeat</span>}
                          </div>
                        </td>
                        <td className="ac-spent">{fmt(customer.totalSpent)}</td>
                        <td className="ac-date">{fmtShort(customer.lastOrderDate)}</td>
                        <td>
                          <span className={`ac-type-badge ${badge.cls}`}>
                            {ctype === 'vip'    && <RiVipDiamondLine />}
                            {ctype === 'repeat' && '●'}
                            {ctype === 'new'    && '●'}
                            {ctype === 'regular'&& '●'}
                            {badge.label}
                          </span>
                        </td>
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
                    );
                  })}
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
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SMS CAMPAIGNS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'sms' && (
        <SmsCampaignsTab onNewCampaign={() => setShowSmsModal(true)} />
      )}

      {/* ── Floating Selection Bar ── */}
      {selectedIds.size > 0 && (
        <div className="ac-bulk-bar" id="bulk-action-bar">
          <div className="ac-bulk-bar__left">
            <FiCheckSquare />
            <strong>{selectedIds.size}</strong> customers selected
          </div>
          <div className="ac-bulk-bar__right">
            <button
              className="ac-bulk-bar__clear"
              onClick={handleClearSelection}
            >
              <FiX /> Clear
            </button>
            <button
              className="ac-bulk-bar__send"
              onClick={() => setShowSmsModal(true)}
              id="bulk-send-sms-btn"
            >
              <FiSend /> Send SMS to Selected
            </button>
          </div>
        </div>
      )}

      {/* ── SMS Modal ── */}
      {showSmsModal && (
        <SmsModal
          selectedIds={[...selectedIds]}
          selectedCount={selectedIds.size}
          onClose={handleSmsModalClose}
          onSent={handleSmsSent}
        />
      )}

    </div>
  );
};

export default AdminCustomers;
