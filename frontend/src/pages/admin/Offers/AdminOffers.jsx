import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import OfferCard from './components/OfferCard';
import OfferFormModal from './components/OfferFormModal';
import OfferPreviewModal from './components/OfferPreviewModal';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
import './AdminOffers.scss';

// Simple debounce hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const AdminOffers = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery(
    debouncedSearch ? { search: debouncedSearch } : undefined
  );
  const offerList = offersResponse?.data || offersResponse || [];
  
  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [preview, setPreview] = useState(null);

  const openAdd = () => {
    setEditingOffer(null);
    setShowModal(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const offer = offerList.find(o => (o._id || o.id) === id);
    setOfferToDelete(offer || { _id: id, title: 'this offer' });
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    try {
      await deleteOfferApi(offerToDelete._id || offerToDelete.id).unwrap();
      showSuccess('Offer deleted successfully');
    } catch (err) {
      const msg = err?.data?.message || err.message || 'Failed to delete offer';
      console.error("Failed to delete", err);
      showError(msg);
    } finally {
      setOfferToDelete(null);
    }
  };

  const handleSubmit = async (form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    if (form.subtitle) formData.append('subtitle', form.subtitle);
    if (form.description) formData.append('description', form.description);
    if (form.type) formData.append('type', form.type);
    formData.append('discountPercentage', (form.discountPercentage === '' || form.discountPercentage === null || form.discountPercentage === undefined) ? '0' : String(form.discountPercentage));
    if (form.couponCode) formData.append('couponCode', form.couponCode);
    if (form.targetUrl) formData.append('targetUrl', form.targetUrl);
    formData.append('isActive', form.isActive);
    if (form.bgColor) formData.append('bgColor', form.bgColor);
    if (form.textColor) formData.append('textColor', form.textColor);
    if (form.offerTag) formData.append('offerTag', form.offerTag);
    if (form.offerCategory) formData.append('offerCategory', form.offerCategory);
    formData.append('isFeatured', form.isFeatured);
    if (form.couponDescription) formData.append('couponDescription', form.couponDescription);
    
    // validity
    if (form.validFrom && form.validTo) {
      formData.append('validity', JSON.stringify({ from: form.validFrom, to: form.validTo }));
    }

    form.images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      if (editingOffer) {
        await updateOffer({ id: editingOffer._id || editingOffer.id, formData }).unwrap();
        showSuccess('Offer updated successfully');
      } else {
        await addOffer(formData).unwrap();
        showSuccess('Offer created successfully');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err?.data?.message || err.message || 'Failed to save offer';
      console.error("Failed to save offer", err);
      showError(msg);
    }
  };

  const isSubmitting = isAdding || isUpdating;

  return (
    <div className="admin-offers">
      <div className="admin-offers__header">
        <h1>Offers & Promotions 🏷️</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Offer
        </button>
      </div>

      {/* Search Bar */}
      <div className="admin-search-bar">
        <FiSearch className="admin-search-bar__icon" />
        <input
          type="text"
          className="admin-search-bar__input"
          placeholder="Search offers by title, coupon code, tag…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button className="admin-search-bar__clear" onClick={() => setSearchInput('')}>
            <FiX />
          </button>
        )}
      </div>

      {isOffersLoading ? (
        <Loader inline message="Loading offers…" />
      ) : (
        <div className="admin-offers__grid">
          {(Array.isArray(offerList) ? offerList : []).map(offer => (
            <OfferCard
              key={offer._id || offer.id}
              offer={offer}
              onPreview={setPreview}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          {Array.isArray(offerList) && offerList.length === 0 && (
            <p className="admin-empty-state">
              {debouncedSearch ? `No offers found for "${debouncedSearch}"` : 'No offers found.'}
            </p>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <OfferPreviewModal 
        preview={preview} 
        onClose={() => setPreview(null)} 
      />

      {/* Add/Edit Modal */}
      <OfferFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        editingOffer={editingOffer}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={confirmDelete}
        itemName={offerToDelete?.title}
        title="Delete Offer?"
      />
    </div>
  );
};

export default AdminOffers;
