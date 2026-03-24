import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { useToast } from '../../../context/ToastContext';
import OfferCard from './components/OfferCard';
import OfferFormModal from './components/OfferFormModal';
import OfferPreviewModal from './components/OfferPreviewModal';
import './AdminOffers.scss';

const AdminOffers = () => {
  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery();
  const offerList = offersResponse?.data || offersResponse || [];
  
  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [preview, setPreview] = useState(null);

  const openAdd = () => {
    setEditingOffer(null);
    setShowModal(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this offer?')) {
      try {
        await deleteOfferApi(id).unwrap();
        showSuccess('Offer deleted successfully');
      } catch (err) {
        const msg = err?.data?.message || err.message || 'Failed to delete offer';
        console.error("Failed to delete", err);
        showError(msg);
      }
    }
  };

  const handleSubmit = async (form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    if (form.subtitle) formData.append('subtitle', form.subtitle);
    if (form.description) formData.append('description', form.description);
    if (form.type) formData.append('type', form.type);
    if (form.discountPercentage !== '') formData.append('discountPercentage', form.discountPercentage);
    if (form.couponCode) formData.append('couponCode', form.couponCode);
    if (form.targetUrl) formData.append('targetUrl', form.targetUrl);
    formData.append('isActive', form.isActive);
    if (form.bgColor) formData.append('bgColor', form.bgColor);
    if (form.textColor) formData.append('textColor', form.textColor);
    
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

      {isOffersLoading ? (
        <p>Loading offers...</p>
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
          {Array.isArray(offerList) && offerList.length === 0 && <p>No offers found.</p>}
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
    </div>
  );
};

export default AdminOffers;
