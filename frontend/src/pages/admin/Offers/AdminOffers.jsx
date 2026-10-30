import React, { useState, useMemo } from 'react';
import {
  FiPlus, FiSearch, FiTag, FiPercent, FiDownload,
  FiTrendingUp, FiBarChart2, FiCalendar, FiShoppingBag, FiEye, FiMousePointer, FiRadio,
} from 'react-icons/fi';
import {
  useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation, useDuplicateOfferMutation,
} from '../../../store/ActionApi/offerApi';
import {
  useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation,
  useGetCouponAnalyticsQuery,
} from '../../../store/ActionApi/couponApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import OfferTableRow from './components/OfferTableRow';
import OfferFormModal from './components/OfferFormModal';
import OfferPreviewModal from './components/OfferPreviewModal';
import CouponTableRow from './components/CouponTableRow';
import CouponFormModal from './components/CouponFormModal';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
import CouponTrendD3Chart from './components/CouponTrendD3Chart';
import CouponProductD3Chart from './components/CouponProductD3Chart';
import OfferUsageD3Chart, { OFFER_METRICS } from './components/OfferUsageD3Chart';
import OfferTrendD3Chart from './components/OfferTrendD3Chart';
import { getOfferStatus, statusMeta, sectionLabel } from './constants/offerConstants';
import './AdminOffers.scss';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TIMEFRAMES = [
  { value: 'weekly', label: '7 days' },
  { value: 'monthly', label: '30 days' },
  { value: 'yearly', label: '12 months' },
];

const OFFER_FILTERS = ['all', 'live', 'scheduled', 'inactive', 'expired'];
const COUPON_FILTERS = ['all', 'active', 'inactive', 'scheduled', 'expired'];

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const num = (n) => (n || 0).toLocaleString('en-IN');

const couponStatus = (c, now = Date.now()) => {
  if (c.validTo && new Date(c.validTo) < now) return 'expired';
  if (c.validFrom && new Date(c.validFrom) > now) return 'scheduled';
  return c.isActive ? 'active' : 'inactive';
};

const downloadCsv = (filename, rows) => {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const StatTile = ({ icon, label, value, sub, tone = 'primary' }) => (
  <div className={`stat-tile stat-tile--${tone}`}>
    <div className="stat-tile__icon">{icon}</div>
    <div>
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value">{value}</div>
      {sub && <div className="stat-tile__sub">{sub}</div>}
    </div>
  </div>
);

const AdminOffers = () => {
  const [activeTab, setActiveTab] = useState('offers');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('monthly');
  const [offerMetric, setOfferMetric] = useState('clicks');
  const debouncedSearch = useDebounce(searchInput, 400);
  const timeframeLabel = TIMEFRAMES.find((t) => t.value === analyticsTimeframe)?.label || '';

  const { showSuccess, showError } = useToast();

  // ── Analytics API ───────────────────────────────────────────────
  const { data: analyticsResponse, isLoading: isAnalyticsLoading } = useGetCouponAnalyticsQuery({
    timeframe: analyticsTimeframe,
  });
  const analyticsData = useMemo(() => analyticsResponse?.data || analyticsResponse || {}, [analyticsResponse]);
  const summaryData = analyticsData.summary || {};
  const highlightsData = analyticsData.highlights || {};
  const trendData = analyticsData.trendData || [];
  const productCouponBreakdown = analyticsData.productCouponBreakdown || [];
  const offerPerformanceList = useMemo(() => analyticsData.offerPerformanceList || [], [analyticsData]);
  const offerTrendData = analyticsData.offerTrendData || [];
  const offerSummary = analyticsData.offerSummary || {};
  const mostUsedCoupon = highlightsData.mostUsedCoupon;
  const topCouponProduct = highlightsData.topCouponProduct;

  const perfById = useMemo(
    () => new Map(offerPerformanceList.map((p) => [String(p._id), p])),
    [offerPerformanceList]
  );

  // ── Offers ──────────────────────────────────────────────────────
  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery(
    debouncedSearch && activeTab === 'offers' ? { search: debouncedSearch } : undefined
  );
  const rawOfferList = useMemo(() => {
    const raw = offersResponse?.data || offersResponse || [];
    return Array.isArray(raw) ? raw : [];
  }, [offersResponse]);

  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();
  const [duplicateOfferApi] = useDuplicateOfferMutation();

  // ── Coupons ─────────────────────────────────────────────────────
  const { data: couponsResponse, isLoading: isCouponsLoading } = useGetCouponsQuery(
    debouncedSearch && activeTab === 'coupons' ? { search: debouncedSearch } : undefined
  );
  const rawCouponList = useMemo(() => {
    const raw = couponsResponse?.data || couponsResponse || [];
    return Array.isArray(raw) ? raw : [];
  }, [couponsResponse]);

  const [createCoupon, { isLoading: isCreatingCoupon }] = useCreateCouponMutation();
  const [updateCouponApi, { isLoading: isUpdatingCoupon }] = useUpdateCouponMutation();
  const [deleteCouponApi] = useDeleteCouponMutation();

  // ── Derived state ───────────────────────────────────────────────
  const offerCounts = useMemo(() => {
    const c = { all: rawOfferList.length, live: 0, scheduled: 0, inactive: 0, expired: 0 };
    rawOfferList.forEach((o) => { c[getOfferStatus(o)] += 1; });
    return c;
  }, [rawOfferList]);

  const couponCounts = useMemo(() => {
    const c = { all: rawCouponList.length, active: 0, inactive: 0, scheduled: 0, expired: 0 };
    rawCouponList.forEach((x) => { c[couponStatus(x)] += 1; });
    return c;
  }, [rawCouponList]);

  const offerList = useMemo(() => {
    const order = { live: 0, scheduled: 1, inactive: 2, expired: 3 };
    return rawOfferList
      .filter((o) => statusFilter === 'all' || getOfferStatus(o) === statusFilter)
      .sort((a, b) => order[getOfferStatus(a)] - order[getOfferStatus(b)]);
  }, [rawOfferList, statusFilter]);

  const couponList = useMemo(
    () => rawCouponList.filter((c) => statusFilter === 'all' || couponStatus(c) === statusFilter),
    [rawCouponList, statusFilter]
  );

  // ── Modal state ─────────────────────────────────────────────────
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [preview, setPreview] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);

  const switchTab = (tab) => { setActiveTab(tab); setSearchInput(''); setStatusFilter('all'); };

  // ── Offer handlers ──────────────────────────────────────────────
  const openAddOffer = () => { setEditingOffer(null); setShowOfferModal(true); };
  const openEditOffer = (offer) => { setEditingOffer(offer); setShowOfferModal(true); };

  const handleDeleteOffer = (id) => {
    const offer = rawOfferList.find((o) => (o._id || o.id) === id);
    setOfferToDelete(offer || { _id: id, title: 'this offer' });
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      await deleteOfferApi(offerToDelete._id || offerToDelete.id).unwrap();
      showSuccess('Offer deleted');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete offer');
    } finally {
      setOfferToDelete(null);
    }
  };

  const handleDuplicateOffer = async (offer) => {
    try {
      await duplicateOfferApi(offer._id || offer.id).unwrap();
      showSuccess('Copy created as a paused draft — edit it and switch it on when ready');
      setStatusFilter('all');
    } catch (err) {
      showError(err?.data?.message || 'Failed to duplicate offer');
    }
  };

  const handleToggleOfferStatus = async (offer) => {
    const id = offer._id || offer.id;
    const formData = new FormData();
    formData.append('isActive', String(!offer.isActive));
    setTogglingId(id);
    try {
      await updateOffer({ id, formData }).unwrap();
      const next = getOfferStatus({ ...offer, isActive: !offer.isActive });
      showSuccess(
        !offer.isActive
          ? next === 'live' ? 'Offer is now live on the storefront'
            : next === 'scheduled' ? 'Offer activated — it goes live at its start time'
            : 'Offer activated, but its end date has passed — extend it to show it'
          : 'Offer paused and hidden from shoppers'
      );
    } catch (err) {
      showError(err?.data?.message || 'Failed to change offer status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmitOffer = async (form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    // Always sent so clearing a field in the form clears it on the offer
    formData.append('subtitle', form.subtitle || '');
    formData.append('description', form.description || '');
    formData.append('badgeText', form.badgeText || '');
    formData.append('ctaText', form.ctaText || '');
    formData.append('targetUrl', form.targetUrl || '');
    formData.append('displayType', form.displayType);
    formData.append('placement', JSON.stringify({
      page: form.page,
      section: form.section || 'main',
      position: form.position || 1,
    }));
    formData.append('styling', JSON.stringify({
      bgColor: form.bgColor,
      textColor: form.textColor,
      overlayOpacity: form.overlayOpacity || 0,
    }));
    formData.append('isActive', String(form.isActive));
    formData.append('validity', JSON.stringify({ from: form.validFrom, to: form.validTo }));

    if (editingOffer) formData.append('existingImages', JSON.stringify(form.existingImages));
    if (form.newImages.length) {
      formData.append('imageAltTexts', JSON.stringify(form.newImages.map((n) => n.altText || '')));
      formData.append('imageLinks', JSON.stringify(form.newImages.map((n) => n.link || '')));
      form.newImages.forEach((n) => formData.append('images', n.file));
    }

    try {
      if (editingOffer) {
        await updateOffer({ id: editingOffer._id || editingOffer.id, formData }).unwrap();
        showSuccess('Offer updated');
      } else {
        await addOffer(formData).unwrap();
        const status = getOfferStatus({ isActive: form.isActive, validity: { from: form.validFrom, to: form.validTo } });
        showSuccess(status === 'live' ? 'Offer published — it is live now'
          : status === 'scheduled' ? 'Offer scheduled — it goes live automatically'
          : 'Offer saved as a paused draft');
      }
      setShowOfferModal(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save offer');
    }
  };

  // ── Coupon handlers ─────────────────────────────────────────────
  const openAddCoupon = () => { setEditingCoupon(null); setShowCouponModal(true); };
  const openEditCoupon = (coupon) => { setEditingCoupon(coupon); setShowCouponModal(true); };

  const handleDeleteCoupon = (id) => {
    const coupon = rawCouponList.find((c) => (c._id || c.id) === id);
    setCouponToDelete(coupon || { _id: id, code: 'this coupon' });
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await deleteCouponApi(couponToDelete._id || couponToDelete.id).unwrap();
      showSuccess('Coupon deleted successfully');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete coupon');
    } finally {
      setCouponToDelete(null);
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    try {
      await updateCouponApi({ id: coupon._id || coupon.id, isActive: !coupon.isActive }).unwrap();
      showSuccess(`Coupon marked as ${!coupon.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showError('Failed to toggle coupon status');
    }
  };

  const handleSubmitCoupon = async (form) => {
    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      minQuantity: form.minQuantity ? Number(form.minQuantity) : 0,
      applicableProducts: form.applicableProducts,
      validFrom: form.validFrom,
      validTo: form.validTo,
      usageLimit: form.usageLimit,
      perUserLimit: form.perUserLimit,
      isActive: form.isActive,
      visibility: form.visibility,
    };

    try {
      if (editingCoupon) {
        await updateCouponApi({ id: editingCoupon._id || editingCoupon.id, ...payload }).unwrap();
        showSuccess('Coupon updated successfully');
      } else {
        await createCoupon(payload).unwrap();
        showSuccess('Coupon created successfully');
      }
      setShowCouponModal(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save coupon');
    }
  };

  // ── Export ──────────────────────────────────────────────────────
  const exportReport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (activeTab === 'offers') {
      downloadCsv(`kidroo-offers-${analyticsTimeframe}-${stamp}.csv`, [
        ['Title', 'Status', 'Page', 'Section', 'Order', 'Starts', 'Ends',
          `Views (${timeframeLabel})`, `Clicks (${timeframeLabel})`, 'CTR %', `Orders (${timeframeLabel})`, `Revenue (${timeframeLabel})`,
          'Lifetime views', 'Lifetime clicks', 'Link'],
        ...offerList.map((o) => {
          const p = perfById.get(String(o._id)) || {};
          return [
            o.title, statusMeta[getOfferStatus(o)].label, o.placement?.page,
            sectionLabel(o.placement?.page, o.placement?.section).replace(/^\W+\s*/, ''), o.placement?.position,
            o.validity?.from ? new Date(o.validity.from).toLocaleString('en-IN') : '',
            o.validity?.to ? new Date(o.validity.to).toLocaleString('en-IN') : '',
            p.impressions || 0, p.clicks || 0, p.ctr || 0, p.orders || 0, p.revenue || 0,
            o.stats?.impressions || 0, o.stats?.clicks || 0, o.targetUrl || '/offers',
          ];
        }),
      ]);
    } else {
      const usage = new Map((analyticsData.couponPerformanceList || []).map((c) => [String(c.code).toUpperCase(), c]));
      downloadCsv(`kidroo-coupons-${analyticsTimeframe}-${stamp}.csv`, [
        ['Code', 'Status', 'Type', 'Value', 'Min order', 'Valid from', 'Valid to', 'Used / limit',
          `Orders (${timeframeLabel})`, `Discount given (${timeframeLabel})`, `Revenue (${timeframeLabel})`],
        ...couponList.map((c) => {
          const u = usage.get(String(c.code).toUpperCase()) || {};
          return [
            c.code, couponStatus(c), c.discountType, c.discountValue, c.minOrderAmount || 0,
            c.validFrom ? new Date(c.validFrom).toLocaleDateString('en-IN') : '',
            c.validTo ? new Date(c.validTo).toLocaleDateString('en-IN') : '',
            `${c.usedCount || 0} / ${c.usageLimit || '∞'}`,
            u.usesCount || 0, u.totalDiscount || 0, u.totalRevenue || 0,
          ];
        }),
      ]);
    }
    showSuccess('Report downloaded');
  };

  const isSubmittingOffer = isAdding || isUpdating;
  const isSubmittingCoupon = isCreatingCoupon || isUpdatingCoupon;
  const filters = activeTab === 'offers' ? OFFER_FILTERS : COUPON_FILTERS;
  const counts = activeTab === 'offers' ? offerCounts : couponCounts;
  const filterLabel = (f) => (activeTab === 'offers' && statusMeta[f] ? statusMeta[f].label : f[0].toUpperCase() + f.slice(1));

  return (
    <div className="admin-offers-page">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="topbar-wrapper">
        <div>
          <h1>🎟️ Offers & Coupons</h1>
          <p className="topbar-sub">Create storefront offer banners and discount codes, and see how they perform.</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline btn-sm" onClick={exportReport}>
            <FiDownload /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={activeTab === 'offers' ? openAddOffer : openAddCoupon}>
            <FiPlus /> {activeTab === 'offers' ? 'New Offer' : 'New Coupon'}
          </button>
        </div>
      </div>

      <div className="tabs-row">
        <div className="type-tabs">
          <button className={`type-tab ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => switchTab('offers')}>
            <FiTag /> Offer Banners <span className="tab-count">{offerCounts.all}</span>
          </button>
          <button className={`type-tab ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => switchTab('coupons')}>
            <FiPercent /> Coupon Codes <span className="tab-count">{couponCounts.all}</span>
          </button>
        </div>

        <div className="timeframe-selector">
          <span className="timeframe-label"><FiCalendar /> Last</span>
          <div className="timeframe-buttons">
            {TIMEFRAMES.map((t) => (
              <button key={t.value}
                className={`timeframe-btn ${analyticsTimeframe === t.value ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'offers' ? (
        <>
          {/* ── Offer KPIs ───────────────────────────────────────── */}
          <div className="stat-tile-grid">
            <StatTile icon={<FiRadio />} label="Live now" value={offerCounts.live}
              sub={`${offerCounts.scheduled} scheduled · ${offerCounts.expired} expired`} tone="success" />
            <StatTile icon={<FiEye />} label={`Views · ${timeframeLabel}`} value={num(offerSummary.impressions)}
              sub="Times an offer was seen on screen" />
            <StatTile icon={<FiMousePointer />} label={`Clicks · ${timeframeLabel}`} value={num(offerSummary.clicks)}
              sub={`${offerSummary.ctr || 0}% click-through rate`} tone="purple" />
            <StatTile icon={<FiShoppingBag />} label={`Orders from offers · ${timeframeLabel}`} value={num(offerSummary.orders)}
              sub={`${inr(offerSummary.revenue)} revenue`} tone="warning" />
          </div>

          <div className="d3-charts-grid">
            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title"><FiTrendingUp /> Offer activity</h3>
                <span className="timeframe-badge">{timeframeLabel}</span>
              </div>
              <div className="card-body">
                {isAnalyticsLoading ? <Loader inline message="Loading activity…" /> : <OfferTrendD3Chart data={offerTrendData} />}
              </div>
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title"><FiBarChart2 /> Top offers</h3>
                <div className="segmented">
                  {OFFER_METRICS.map((m) => (
                    <button key={m.key} className={offerMetric === m.key ? 'active' : ''} onClick={() => setOfferMetric(m.key)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-body">
                {isAnalyticsLoading
                  ? <Loader inline message="Loading offers…" />
                  : <OfferUsageD3Chart data={offerPerformanceList} metric={offerMetric} />}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Coupon KPIs ──────────────────────────────────────── */}
          <div className="stat-tile-grid">
            <StatTile icon="🎟️" label="Most used coupon" value={mostUsedCoupon ? mostUsedCoupon.code : '—'}
              sub={mostUsedCoupon ? `${mostUsedCoupon.usesCount} orders · ${inr(mostUsedCoupon.totalDiscount)} saved` : 'No coupon orders yet'} />
            <StatTile icon="🛍️" label="Top coupon product"
              value={topCouponProduct ? (topCouponProduct.productName.length > 20 ? `${topCouponProduct.productName.slice(0, 18)}…` : topCouponProduct.productName) : '—'}
              sub={topCouponProduct ? `${topCouponProduct.totalCouponOrders} orders with a coupon` : 'No coupon orders yet'} tone="success" />
            <StatTile icon="🧾" label={`Coupon orders · ${timeframeLabel}`} value={num(summaryData.totalCouponOrders)}
              sub={`${summaryData.activeCouponsCount || 0} active coupons`} tone="purple" />
            <StatTile icon="💰" label={`Coupon revenue · ${timeframeLabel}`} value={inr(summaryData.totalCouponRevenue)}
              sub={`${inr(summaryData.totalDiscountGiven)} discount given`} tone="warning" />
          </div>

          <div className="d3-charts-grid">
            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title"><FiTrendingUp /> Coupon usage</h3>
                <span className="timeframe-badge">{timeframeLabel}</span>
              </div>
              <div className="card-body">
                {isAnalyticsLoading ? <Loader inline message="Loading usage…" /> : <CouponTrendD3Chart data={trendData} timeframe={analyticsTimeframe} />}
              </div>
            </div>
            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title"><FiShoppingBag /> Top products bought with a coupon</h3>
              </div>
              <div className="card-body">
                {isAnalyticsLoading ? <Loader inline message="Loading products…" /> : <CouponProductD3Chart data={productCouponBreakdown} />}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h3 className="card-title">Coupon use by product</h3>
              <span className="cell-muted">Which codes were applied to which products · {timeframeLabel}</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 320 }}>
              <table className="offers-table mini-table">
                <thead>
                  <tr><th>Product</th><th>Coupons applied</th><th>Orders</th><th>Total discount</th></tr>
                </thead>
                <tbody>
                  {productCouponBreakdown.length === 0 ? (
                    <tr><td colSpan="4" className="admin-empty-state">No coupon orders in this period.</td></tr>
                  ) : productCouponBreakdown.map((item, idx) => (
                    <tr key={item.productId || idx}>
                      <td>
                        <div className="offer-name-cell">
                          {item.image ? <img src={item.image} alt="" className="product-thumb" /> : <div className="product-thumb">📦</div>}
                          <span className="cell-strong">{item.productName || 'Product'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="badge-wrap">
                          {(item.couponsUsedMap || []).map((c, i) => (
                            <span key={i} className="badge badge-purple">{c.code} ({c.count})</span>
                          ))}
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{item.totalCouponOrders}</span></td>
                      <td className="cell-strong" style={{ color: 'var(--success)' }}>{inr(item.totalDiscount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── List ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="filters">
            {filters.map((f) => (
              <button key={f} className={`filter-btn ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
                {f === 'all' ? 'All' : filterLabel(f)} <span className="filter-count">{counts[f] || 0}</span>
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="search-icon"><FiSearch /></span>
            <input type="text" placeholder={`Search ${activeTab}…`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'offers' ? (
            <table className="offers-table">
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Placement</th>
                  <th>Schedule</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isOffersLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}><Loader inline message="Loading offers…" /></td></tr>
                ) : offerList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-empty-state">
                      {rawOfferList.length === 0 ? (
                        <>
                          <div className="empty-icon">🎁</div>
                          <strong>No offers yet</strong>
                          <p>Create a banner for the home, shop, product or offers page.</p>
                          <button className="btn btn-primary" onClick={openAddOffer}><FiPlus /> Create your first offer</button>
                        </>
                      ) : `No ${filterLabel(statusFilter).toLowerCase()} offers${debouncedSearch ? ` matching “${debouncedSearch}”` : ''}.`}
                    </td>
                  </tr>
                ) : offerList.map((offer) => (
                  <OfferTableRow
                    key={offer._id || offer.id}
                    offer={offer}
                    perf={perfById.get(String(offer._id))}
                    timeframeLabel={timeframeLabel}
                    onPreview={setPreview}
                    onEdit={openEditOffer}
                    onDuplicate={handleDuplicateOffer}
                    onDelete={handleDeleteOffer}
                    onToggleStatus={handleToggleOfferStatus}
                    busy={togglingId === (offer._id || offer.id)}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="offers-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Visibility</th>
                  <th>Valid Until</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isCouponsLoading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}><Loader inline message="Loading coupons…" /></td></tr>
                ) : couponList.length === 0 ? (
                  <tr><td colSpan="8" className="admin-empty-state">No coupons found.</td></tr>
                ) : couponList.map((coupon) => (
                  <CouponTableRow
                    key={coupon._id || coupon.id}
                    coupon={coupon}
                    onEdit={openEditCoupon}
                    onDelete={handleDeleteCoupon}
                    onToggleStatus={handleToggleCouponStatus}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <OfferPreviewModal preview={preview} onClose={() => setPreview(null)} onEdit={openEditOffer} />

      <OfferFormModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSubmit={handleSubmitOffer}
        editingOffer={editingOffer}
        isSubmitting={isSubmittingOffer}
      />

      <CouponFormModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSubmit={handleSubmitCoupon}
        editingCoupon={editingCoupon}
        isSubmitting={isSubmittingCoupon}
      />

      <ConfirmDeleteModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={confirmDeleteOffer}
        itemName={offerToDelete?.title}
        title="Delete Offer?"
      />

      <ConfirmDeleteModal
        isOpen={!!couponToDelete}
        onClose={() => setCouponToDelete(null)}
        onConfirm={confirmDeleteCoupon}
        itemName={couponToDelete?.code}
        title="Delete Coupon?"
      />
    </div>
  );
};

export default AdminOffers;
