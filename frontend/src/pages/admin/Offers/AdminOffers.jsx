import React, { useState, useMemo } from 'react';
import { 
  FiPlus, FiSearch, FiX, FiTag, FiPercent, FiDownload, 
  FiTrendingUp, FiPieChart, FiBarChart2, FiCalendar, FiShoppingBag, FiAward, FiZap 
} from 'react-icons/fi';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { 
  useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation, 
  useGetCouponAnalyticsQuery 
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
import OfferUsageD3Chart from './components/OfferUsageD3Chart';
import './AdminOffers.scss';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const AdminOffers = () => {
  const [activeTab, setActiveTab] = useState('offers');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('monthly'); // weekly | monthly | yearly
  const debouncedSearch = useDebounce(searchInput, 400);

  const { showSuccess, showError } = useToast();

  // ── Analytics API ───────────────────────────────────────────────
  const { data: analyticsResponse, isLoading: isAnalyticsLoading } = useGetCouponAnalyticsQuery({
    timeframe: analyticsTimeframe,
  });
  const analyticsData = analyticsResponse?.data || analyticsResponse || {};

  const summaryData = analyticsData?.summary || {};
  const highlightsData = analyticsData?.highlights || {};
  const trendData = analyticsData?.trendData || [];
  const productCouponBreakdown = analyticsData?.productCouponBreakdown || [];
  const offerPerformanceList = analyticsData?.offerPerformanceList || [];
  const couponPerformanceList = analyticsData?.couponPerformanceList || [];

  // Highlights
  const mostUsedCoupon = highlightsData?.mostUsedCoupon;
  const topCouponProduct = highlightsData?.topCouponProduct;
  const topOffer = highlightsData?.topOffer;

  // ── Offers ──────────────────────────────────────────────────────
  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery(
    debouncedSearch && activeTab === 'offers' ? { search: debouncedSearch } : undefined
  );
  const rawOfferList = offersResponse?.data || offersResponse || [];

  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();

  // ── Coupons ─────────────────────────────────────────────────────
  const { data: couponsResponse, isLoading: isCouponsLoading } = useGetCouponsQuery(
    debouncedSearch && activeTab === 'coupons' ? { search: debouncedSearch } : undefined
  );
  const rawCouponList = couponsResponse?.data || couponsResponse || [];

  const [createCoupon, { isLoading: isCreatingCoupon }] = useCreateCouponMutation();
  const [updateCouponApi, { isLoading: isUpdatingCoupon }] = useUpdateCouponMutation();
  const [deleteCouponApi] = useDeleteCouponMutation();

  // ── Derived State ───────────────────────────────────────────────
  const filterByStatus = (list) => {
    if (!Array.isArray(list)) return [];
    if (statusFilter === 'all') return list;
    const now = new Date();
    
    return list.filter(item => {
      const isExp = (item.validity?.to || item.validTo) && new Date(item.validity?.to || item.validTo) < now;
      const isSched = (item.validity?.from || item.validFrom) && new Date(item.validity?.from || item.validFrom) > now;
      
      if (statusFilter === 'expired') return isExp;
      if (statusFilter === 'scheduled') return isSched;
      if (statusFilter === 'active') return item.isActive && !isExp && !isSched;
      if (statusFilter === 'inactive') return !item.isActive && !isExp;
      return true;
    });
  };

  const offerList = filterByStatus(rawOfferList);
  const couponList = filterByStatus(rawCouponList);

  const offerCount = Array.isArray(rawOfferList) ? rawOfferList.length : 0;
  const couponCount = Array.isArray(rawCouponList) ? rawCouponList.length : 0;

  // ── Modal state ─────────────────────────────────────────────────
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [preview, setPreview] = useState(null);

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);

  // ── Offer handlers ──────────────────────────────────────────────
  const openAddOffer = () => { setEditingOffer(null); setShowOfferModal(true); };
  const openEditOffer = (offer) => { setEditingOffer(offer); setShowOfferModal(true); };

  const handleDeleteOffer = (id) => {
    const offer = rawOfferList.find(o => (o._id || o.id) === id);
    setOfferToDelete(offer || { _id: id, title: 'this offer' });
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      await deleteOfferApi(offerToDelete._id || offerToDelete.id).unwrap();
      showSuccess('Offer deleted successfully');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete offer');
    } finally {
      setOfferToDelete(null);
    }
  };

  const handleToggleOfferStatus = async (offer) => {
    const formData = new FormData();
    formData.append('isActive', !offer.isActive);
    try {
      await updateOffer({ id: offer._id || offer.id, formData }).unwrap();
      showSuccess(`Offer marked as ${!offer.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showError('Failed to toggle offer status');
    }
  };

  const handleSubmitOffer = async (form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    if (form.subtitle) formData.append('subtitle', form.subtitle);
    if (form.description) formData.append('description', form.description);
    formData.append('displayType', form.displayType);

    formData.append('placement', JSON.stringify({
      page: form.page,
      section: form.section || 'main',
      position: form.position || 0,
    }));

    formData.append('styling', JSON.stringify({
      bgColor: form.bgColor,
      textColor: form.textColor,
      overlayOpacity: form.overlayOpacity || 0,
    }));

    if (form.targetUrl) formData.append('targetUrl', form.targetUrl);
    formData.append('isActive', form.isActive);

    if (form.validFrom && form.validTo) {
      formData.append('validity', JSON.stringify({ from: form.validFrom, to: form.validTo }));
    }

    if (form.imageAltTexts?.length > 0) formData.append('imageAltTexts', JSON.stringify(form.imageAltTexts));
    if (form.imageLinks?.length > 0) formData.append('imageLinks', JSON.stringify(form.imageLinks));

    if (form.images && form.images.length) {
      form.images.forEach((file) => formData.append('images', file));
    }

    try {
      if (editingOffer) {
        await updateOffer({ id: editingOffer._id || editingOffer.id, formData }).unwrap();
        showSuccess('Offer updated successfully');
      } else {
        await addOffer(formData).unwrap();
        showSuccess('Offer created successfully');
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
    const coupon = rawCouponList.find(c => (c._id || c.id) === id);
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

  const isSubmittingOffer = isAdding || isUpdating;
  const isSubmittingCoupon = isCreatingCoupon || isUpdatingCoupon;

  return (
    <div className="admin-offers-page">
      
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="topbar-wrapper">
        <h1>🎟️ Offer & Coupon Manager</h1>
        <div className="topbar-right">
          <button className="btn btn-outline btn-sm" onClick={() => showSuccess('Report exported!')}>
            <FiDownload /> Export Report
          </button>
          <button className="btn btn-primary" onClick={activeTab === 'offers' ? openAddOffer : openAddCoupon}>
            <FiPlus /> {activeTab === 'offers' ? 'Create New Offer' : 'Create New Coupon'}
          </button>
        </div>
      </div>

      <div className="type-tabs">
        <button className={`type-tab ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => { setActiveTab('offers'); setSearchInput(''); setStatusFilter('all'); }}>
          <FiTag /> Offers <span className="tab-count">{offerCount}</span>
        </button>
        <button className={`type-tab ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => { setActiveTab('coupons'); setSearchInput(''); setStatusFilter('all'); }}>
          <FiPercent /> Coupons <span className="tab-count">{couponCount}</span>
        </button>
      </div>

      {/* ── Analytics Controls Header & Timeframe Selector ───────────── */}
      <div className="analytics-header-card card">
        <div className="analytics-title-area">
          <div>
            <h2><FiTrendingUp className="icon-pulse" /> Coupon & Offer Analysis System</h2>
            <p>Track coupon usage performance, top product applications, and offer conversions with D3 visualizations</p>
          </div>

          <div className="timeframe-selector">
            <span className="timeframe-label"><FiCalendar /> Timeframe:</span>
            <div className="timeframe-buttons">
              <button 
                className={`timeframe-btn ${analyticsTimeframe === 'weekly' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`timeframe-btn ${analyticsTimeframe === 'monthly' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`timeframe-btn ${analyticsTimeframe === 'yearly' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* ── Highlight Metric Cards ─────────────────────────────── */}
        <div className="analytics-highlight-grid">
          {/* Card 1: Most Used Coupon */}
          <div className="highlight-card primary-theme">
            <div className="highlight-icon">🎟️</div>
            <div className="highlight-info">
              <span className="highlight-label">Most Used Coupon</span>
              <div className="highlight-title">{mostUsedCoupon ? mostUsedCoupon.code : 'None Yet'}</div>
              <div className="highlight-sub">
                <strong>{mostUsedCoupon ? mostUsedCoupon.usesCount : 0}</strong> times used • 
                Saved ₹{mostUsedCoupon ? mostUsedCoupon.totalDiscount : 0}
              </div>
            </div>
          </div>

          {/* Card 2: Top Product with Coupon */}
          <div className="highlight-card success-theme">
            <div className="highlight-icon">🛍️</div>
            <div className="highlight-info">
              <span className="highlight-label">Top Coupon-Applied Product</span>
              <div className="highlight-title" title={topCouponProduct ? topCouponProduct.productName : 'None'}>
                {topCouponProduct ? (topCouponProduct.productName.length > 20 ? topCouponProduct.productName.substring(0, 18) + '…' : topCouponProduct.productName) : 'None'}
              </div>
              <div className="highlight-sub">
                <strong>{topCouponProduct ? topCouponProduct.totalCouponOrders : 0}</strong> orders with coupon
              </div>
            </div>
          </div>

          {/* Card 3: Top Offer */}
          <div className="highlight-card warning-theme">
            <div className="highlight-icon">🌟</div>
            <div className="highlight-info">
              <span className="highlight-label">Most Popular Offer</span>
              <div className="highlight-title" title={topOffer ? topOffer.title : 'None'}>
                {topOffer ? (topOffer.title.length > 20 ? topOffer.title.substring(0, 18) + '…' : topOffer.title) : 'None'}
              </div>
              <div className="highlight-sub">
                <strong>{topOffer ? topOffer.estimatedUses : 0}</strong> estimated conversions
              </div>
            </div>
          </div>

          {/* Card 4: Total Coupon Revenue & Savings */}
          <div className="highlight-card purple-theme">
            <div className="highlight-icon">💰</div>
            <div className="highlight-info">
              <span className="highlight-label">Total Discounts & Revenue</span>
              <div className="highlight-title">₹{summaryData.totalCouponRevenue !== undefined ? summaryData.totalCouponRevenue : 0}</div>
              <div className="highlight-sub">
                Saved ₹{summaryData.totalDiscountGiven !== undefined ? summaryData.totalDiscountGiven : 0} across {summaryData.totalCouponOrders || 0} orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── D3 Charts Grid ──────────────────────────────────────── */}
      <div className="d3-charts-grid">
        {/* D3 Chart 1: Usage Trend */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title"><FiTrendingUp /> Coupon & Offer Usage Trend</h3>
            <span className="timeframe-badge">{analyticsTimeframe.toUpperCase()} VIEW</span>
          </div>
          <div className="card-body">
            {isAnalyticsLoading ? (
              <Loader inline message="Rendering D3 Trend Chart…" />
            ) : (
              <CouponTrendD3Chart data={trendData} timeframe={analyticsTimeframe} />
            )}
          </div>
        </div>

        {/* D3 Chart 2: Product Breakdown */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title"><FiShoppingBag /> Top Products with Coupon Applied</h3>
            <span className="timeframe-badge">PRODUCT DISTRIBUTION</span>
          </div>
          <div className="card-body">
            {isAnalyticsLoading ? (
              <Loader inline message="Rendering D3 Product Chart…" />
            ) : (
              <CouponProductD3Chart data={productCouponBreakdown} />
            )}
          </div>
        </div>
      </div>

      {/* D3 Chart 3: Offer Performance & Breakdown Table */}
      <div className="d3-charts-grid" style={{ marginTop: '20px' }}>
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title"><FiBarChart2 /> Offer Performance by Placement & Display</h3>
            <span className="timeframe-badge">OFFER CONVERSIONS</span>
          </div>
          <div className="card-body">
            {isAnalyticsLoading ? (
              <Loader inline message="Rendering D3 Offer Chart…" />
            ) : (
              <OfferUsageD3Chart data={offerPerformanceList} />
            )}
          </div>
        </div>

        {/* Product-Level Coupon Usage Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Coupon Application by Product</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Which coupon applied to which product</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
              <table className="offers-table mini-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Coupons Applied</th>
                    <th>Orders</th>
                    <th>Total Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {productCouponBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="admin-empty-state" style={{ padding: '24px 0' }}>
                        No product coupon usage recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    productCouponBreakdown.map((item, idx) => (
                      <tr key={item.productId || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.image ? (
                              <img src={item.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                            )}
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>
                              {(item.productName || 'Product').length > 22 ? (item.productName || 'Product').substring(0, 20) + '…' : (item.productName || 'Product')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(item.couponsUsedMap || []).map((c, i) => (
                              <span key={i} className="badge badge-purple" style={{ fontSize: '10px' }}>
                                {c.code} ({c.count})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{item.totalCouponOrders}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ₹{item.totalDiscount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Offers / Coupons Table ────────────────────────────── */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">All {activeTab === 'offers' ? 'Offers' : 'Coupons'}</h2>
          <div className="search-box">
            <span className="search-icon"><FiSearch /></span>
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>
        
        <div style={{ padding: '14px 20px 0', display: 'flex', gap: '8px', borderBottom: '1px solid #F0F0F0', paddingBottom: '14px' }}>
          <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          <button className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>Active</button>
          <button className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`} onClick={() => setStatusFilter('inactive')}>Inactive</button>
          <button className={`filter-btn ${statusFilter === 'scheduled' ? 'active' : ''}`} onClick={() => setStatusFilter('scheduled')}>Scheduled</button>
          <button className={`filter-btn ${statusFilter === 'expired' ? 'active' : ''}`} onClick={() => setStatusFilter('expired')}>Expired</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="offers-table">
            <thead>
              <tr>
                <th>{activeTab === 'offers' ? 'Offer Name' : 'Coupon Code'}</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Display / Visibility</th>
                <th>Valid Until</th>
                <th>Uses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'offers' ? (
                isOffersLoading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}><Loader inline message="Loading offers…" /></td></tr>
                ) : offerList.length === 0 ? (
                  <tr><td colSpan="8" className="admin-empty-state">No offers found.</td></tr>
                ) : (
                  offerList.map(offer => (
                    <OfferTableRow 
                      key={offer._id || offer.id} 
                      offer={offer} 
                      onEdit={openEditOffer} 
                      onDelete={handleDeleteOffer} 
                      onToggleStatus={handleToggleOfferStatus} 
                    />
                  ))
                )
              ) : (
                isCouponsLoading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}><Loader inline message="Loading coupons…" /></td></tr>
                ) : couponList.length === 0 ? (
                  <tr><td colSpan="8" className="admin-empty-state">No coupons found.</td></tr>
                ) : (
                  couponList.map(coupon => (
                    <CouponTableRow 
                      key={coupon._id || coupon.id} 
                      coupon={coupon} 
                      onEdit={openEditCoupon} 
                      onDelete={handleDeleteCoupon} 
                      onToggleStatus={handleToggleCouponStatus} 
                    />
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <OfferPreviewModal preview={preview} onClose={() => setPreview(null)} />

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

