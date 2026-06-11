import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiX, FiTag, FiPercent } from 'react-icons/fi';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } from '../../../store/ActionApi/couponApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import OfferCard from './components/OfferCard';
import OfferFormModal from './components/OfferFormModal';
import OfferPreviewModal from './components/OfferPreviewModal';
import CouponCard from './components/CouponCard';
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
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  // ── Offers ──────────────────────────────────────────────────────
  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery(
    debouncedSearch && activeTab === 'offers' ? { search: debouncedSearch } : undefined
  );
  const offerList = offersResponse?.data || offersResponse || [];

  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();

  // ── Coupons ─────────────────────────────────────────────────────
  const { data: couponsResponse, isLoading: isCouponsLoading } = useGetCouponsQuery(
    debouncedSearch && activeTab === 'coupons' ? { search: debouncedSearch } : undefined
  );
  const couponList = couponsResponse?.data || couponsResponse || [];

  const [createCoupon, { isLoading: isCreatingCoupon }] = useCreateCouponMutation();
  const [updateCouponApi, { isLoading: isUpdatingCoupon }] = useUpdateCouponMutation();
  const [deleteCouponApi] = useDeleteCouponMutation();

  const { showSuccess, showError } = useToast();

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
    const offer = (Array.isArray(offerList) ? offerList : []).find(o => (o._id || o.id) === id);
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

    if (form.imageAltTexts?.length > 0) {
      formData.append('imageAltTexts', JSON.stringify(form.imageAltTexts));
    }
    if (form.imageLinks?.length > 0) {
      formData.append('imageLinks', JSON.stringify(form.imageLinks));
    }

    form.images.forEach((file) => formData.append('images', file));

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
    const coupon = (Array.isArray(couponList) ? couponList : []).find(c => (c._id || c.id) === id);
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

  // ── Counts ──────────────────────────────────────────────────────
  const offerCount = Array.isArray(offerList) ? offerList.length : 0;
  const couponCount = Array.isArray(couponList) ? couponList.length : 0;

  return (
    <div className="admin-offers">
      <div className="admin-offers__header">
        <h1>Offers & Coupons 🏷️</h1>
        <button className="admin-btn admin-btn--primary"
          onClick={activeTab === 'offers' ? openAddOffer : openAddCoupon}>
          <FiPlus /> {activeTab === 'offers' ? 'Add Offer' : 'Add Coupon'}
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-offers__tabs">
        <button
          className={`admin-offers__tab ${activeTab === 'offers' ? 'admin-offers__tab--active' : ''}`}
          onClick={() => { setActiveTab('offers'); setSearchInput(''); }}
        >
          <FiTag /> Offers <span className="admin-offers__tab-count">{offerCount}</span>
        </button>
        <button
          className={`admin-offers__tab ${activeTab === 'coupons' ? 'admin-offers__tab--active' : ''}`}
          onClick={() => { setActiveTab('coupons'); setSearchInput(''); }}
        >
          <FiPercent /> Coupons <span className="admin-offers__tab-count">{couponCount}</span>
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-bar">
        <FiSearch className="admin-search-bar__icon" />
        <input type="text" className="admin-search-bar__input"
          placeholder={activeTab === 'offers' ? 'Search offers by title, page...' : 'Search coupons by code, description...'}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} />
        {searchInput && (
          <button className="admin-search-bar__clear" onClick={() => setSearchInput('')}>
            <FiX />
          </button>
        )}
      </div>

      {/* Offers Tab Content */}
      {activeTab === 'offers' && (
        <>
          {isOffersLoading ? (
            <Loader inline message="Loading offers…" />
          ) : (
            <div className="admin-offers__grid">
              {(Array.isArray(offerList) ? offerList : []).map(offer => (
                <OfferCard
                  key={offer._id || offer.id}
                  offer={offer}
                  onEdit={openEditOffer}
                  onDelete={handleDeleteOffer}
                />
              ))}
              {Array.isArray(offerList) && offerList.length === 0 && (
                <p className="admin-empty-state">
                  {debouncedSearch ? `No offers found for "${debouncedSearch}"` : 'No offers yet. Create your first offer!'}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Coupons Tab Content */}
      {activeTab === 'coupons' && (
        <>
          {isCouponsLoading ? (
            <Loader inline message="Loading coupons…" />
          ) : (
            <div className="admin-offers__grid">
              {(Array.isArray(couponList) ? couponList : []).map(coupon => (
                <CouponCard
                  key={coupon._id || coupon.id}
                  coupon={coupon}
                  onEdit={openEditCoupon}
                  onDelete={handleDeleteCoupon}
                />
              ))}
              {Array.isArray(couponList) && couponList.length === 0 && (
                <p className="admin-empty-state">
                  {debouncedSearch ? `No coupons found for "${debouncedSearch}"` : 'No coupons yet. Create your first coupon!'}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <OfferPreviewModal preview={preview} onClose={() => setPreview(null)} />

      {/* Offer Form Modal */}
      <OfferFormModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSubmit={handleSubmitOffer}
        editingOffer={editingOffer}
        isSubmitting={isSubmittingOffer}
      />

      {/* Coupon Form Modal */}
      <CouponFormModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSubmit={handleSubmitCoupon}
        editingCoupon={editingCoupon}
        isSubmitting={isSubmittingCoupon}
      />

      {/* Delete Confirmation — Offer */}
      <ConfirmDeleteModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={confirmDeleteOffer}
        itemName={offerToDelete?.title}
        title="Delete Offer?"
      />

      {/* Delete Confirmation — Coupon */}
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
