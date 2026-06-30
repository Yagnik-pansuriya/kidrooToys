import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiX, FiTag, FiPercent, FiDownload } from 'react-icons/fi';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } from '../../../store/ActionApi/couponApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import OfferTableRow from './components/OfferTableRow';
import OfferFormModal from './components/OfferFormModal';
import OfferPreviewModal from './components/OfferPreviewModal';
import CouponTableRow from './components/CouponTableRow';
import CouponFormModal from './components/CouponFormModal';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
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
  const debouncedSearch = useDebounce(searchInput, 400);

  const { showSuccess, showError } = useToast();

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

      {/* ── Stats Grid (MOCKED) ───────────────────────────────── */}
      {/* Note: Revenue, Uses, and Avg Discount are static mocks as per HTML UI */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent-color': 'var(--primary)' }}>
          <div className="stat-icon">🎟️</div>
          <div className="stat-label">Total {activeTab === 'offers' ? 'Offers' : 'Coupons'}</div>
          <div className="stat-value">{activeTab === 'offers' ? offerCount : couponCount}</div>
          <div className="stat-sub"><span className="stat-up">{rawOfferList.filter(o => o.isActive).length} Active</span></div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--success)' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-label">Revenue via {activeTab === 'offers' ? 'Offers' : 'Coupons'}</div>
          <div className="stat-value">₹84,320</div>
          <div className="stat-sub"><span className="stat-up">↑ 18%</span> vs last month</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--purple)' }}>
          <div className="stat-icon">👆</div>
          <div className="stat-label">Total Uses</div>
          <div className="stat-value">1,247</div>
          <div className="stat-sub"><span className="stat-up">↑ 34%</span> this month</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--warning)' }}>
          <div className="stat-icon">⚡</div>
          <div className="stat-label">Avg. Discount Given</div>
          <div className="stat-value">₹127</div>
          <div className="stat-sub"><span className="stat-down">↑ ₹12</span> vs last month</div>
        </div>
      </div>

      {/* ── Offers / Coupons Table ────────────────────────────── */}
      <div className="card">
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

      {/* ── Analytics (MOCKED) ────────────────────────────────── */}
      <div className="analytics-grid">
        {/* Performance */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h2 className="card-title">Offer Performance</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 30 days</span>
          </div>
          <div className="card-body">
            {[
              { name: 'Free Shipping Bar', uses: 521, rev: '₹28,450', pct: 90 },
              { name: 'Summer Flash Sale', uses: 342, rev: '₹31,200', pct: 68 },
              { name: 'Bundle & Save', uses: 189, rev: '₹18,900', pct: 48 },
              { name: 'First Order Welcome', uses: 98, rev: '₹5,770', pct: 30 },
            ].map((p, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 700 }}>{p.rev}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="mini-progress" style={{ flex: 1 }}>
                    <div className="mini-progress-fill" style={{ width: `${p.pct}%`, background: 'var(--purple)' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '50px' }}>{p.uses} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h2 className="card-title">Daily Offer Usage</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This week</span>
          </div>
          <div className="card-body">
            <div className="mini-chart">
              {[38, 52, 45, 71, 89, 134, 118].map((v, i, arr) => (
                <div key={i} className="bar" style={{ height: `${Math.round((v/Math.max(...arr))*56)+4}px` }} title={`${v} uses`}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <span key={d} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d}</span>
              ))}
            </div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--primary-light)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontFamily: '"Fredoka One", cursive', color: 'var(--primary)' }}>247</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>This Week</div>
                </div>
                <div style={{ background: 'var(--success-light)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontFamily: '"Fredoka One", cursive', color: 'var(--success)' }}>₹31,490</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Revenue</div>
                </div>
              </div>
            </div>
          </div>
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
