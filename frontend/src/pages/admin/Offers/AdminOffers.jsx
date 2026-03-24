import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye } from 'react-icons/fi';
import OfferRenderer from '../../../components/OfferRenderer/OfferRenderer';
import { useGetOffersQuery, useAddOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } from '../../../store/ActionApi/offerApi';
import { useToast } from '../../../context/ToastContext';
import './AdminOffers.scss';

const AdminOffers = () => {
  const { data: offersResponse, isLoading: isOffersLoading } = useGetOffersQuery();
  const offerList = offersResponse?.data || offersResponse || [];
  
  const [addOffer, { isLoading: isAdding }] = useAddOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOfferApi] = useDeleteOfferMutation();
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', type: 'post',
    images: [], existingImages: [], discountPercentage: '', couponCode: '', validFrom: '', validTo: '',
    isActive: true, bgColor: '#FF6B35', textColor: '#FFFFFF',
    targetUrl: ''
  });

  const offerTypes = [
    { value: 'slider', label: '🎠 Image Slider', desc: 'Carousel of promotional images' },
    { value: 'fullscreen-poster', label: '🖼️ Full Screen Poster', desc: 'Full-width promotional banner' },
    { value: 'post', label: '📝 Post / Card', desc: 'Simple promotional card' },
    { value: 'buyable', label: '🛒 Buyable Product', desc: 'Product card with buy button' },
  ];

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', description: '', type: 'post', images: [], existingImages: [], discountPercentage: '', couponCode: '', validFrom: '', validTo: '', isActive: true, bgColor: '#FF6B35', textColor: '#FFFFFF', targetUrl: '' });
    setShowModal(true);
  };

  const openEdit = (offer) => {
    setEditing(offer._id);
    const validFrom = offer.validity?.from ? new Date(offer.validity.from).toISOString().split('T')[0] : '';
    const validTo = offer.validity?.to ? new Date(offer.validity.to).toISOString().split('T')[0] : '';
    setForm({
      title: offer.title || '', subtitle: offer.subtitle || '', description: offer.description || '',
      type: offer.type || 'post', images: [], existingImages: offer.image || offer.images || [], discountPercentage: offer.discountPercentage || '',
      couponCode: offer.couponCode || '', validFrom, validTo,
      isActive: offer.isActive !== undefined ? offer.isActive : true, bgColor: offer.bgColor || '#FF6B35', textColor: offer.textColor || '#FFFFFF',
      targetUrl: offer.targetUrl || '',
    });
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
        alert(msg);
        showError(msg);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (editing) {
        await updateOffer({ id: editing, formData }).unwrap();
        showSuccess('Offer updated successfully');
      } else {
        await addOffer(formData).unwrap();
        showSuccess('Offer created successfully');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err?.data?.message || err.message || 'Failed to save offer';
      console.error("Failed to save offer", err);
      alert(msg);
      showError(msg);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm(p => ({ ...p, images: [...p.images, ...files] }));
  };
  
  const removeImage = (index) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  const isSubmitting = isAdding || isUpdating;

  return (
    <div className="admin-offers">
      <div className="admin-offers__header">
        <h1>Offers & Promotions 🏷️</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}><FiPlus /> Add Offer</button>
      </div>

      {isOffersLoading ? (
        <p>Loading offers...</p>
      ) : (
        <div className="admin-offers__grid">
          {(Array.isArray(offerList) ? offerList : []).map(offer => (
            <div className="admin-offer-card" key={offer._id || offer.id}>
              <div className="admin-offer-card__header">
                <div>
                  <span className={`admin-offer-card__type admin-offer-card__type--${offer.type}`}>
                    {offerTypes.find(t => t.value === offer.type)?.label || offer.type}
                  </span>
                  <span className={`admin-offer-card__status ${offer.isActive ? 'admin-offer-card__status--active' : ''}`}>
                    {offer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="admin-actions">
                  <button className="admin-action-btn admin-action-btn--edit" onClick={() => setPreview(offer)} title="Preview"><FiEye /></button>
                  <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(offer)} title="Edit"><FiEdit2 /></button>
                  <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(offer._id || offer.id)} title="Delete"><FiTrash2 /></button>
                </div>
              </div>
              <h3 className="admin-offer-card__title">{offer.title}</h3>
              <p className="admin-offer-card__desc">{offer.subtitle}</p>
              <div className="admin-offer-card__meta">
                {offer.discountPercentage > 0 && <span className="admin-offer-card__discount">{offer.discountPercentage}% OFF</span>}
                {offer.couponCode && <span className="admin-offer-card__coupon">{offer.couponCode}</span>}
                {offer.validity?.to && <span className="admin-offer-card__date">Until: {new Date(offer.validity.to).toLocaleDateString()}</span>}
              </div>
              <div className="admin-offer-card__colors">
                <span style={{ background: offer.bgColor }} />
                <span style={{ background: offer.textColor, border: '1px solid #ddd' }} />
              </div>
            </div>
          ))}
          {Array.isArray(offerList) && offerList.length === 0 && <p>No offers found.</p>}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <div className="admin-modal admin-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Preview: {preview.title}</h2>
              <button onClick={() => setPreview(null)}><FiX /></button>
            </div>
            <div className="admin-offer-preview">
              <OfferRenderer offer={preview} />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Offer' : 'Create New Offer'}</h2>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              {/* Offer Type Selection */}
              <div className="offer-type-grid">
                {offerTypes.map(t => (
                  <button key={t.value} type="button"
                    className={`offer-type-option ${form.type === t.value ? 'offer-type-option--active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, type: t.value }))}
                  >
                    <span className="offer-type-option__label">{t.label}</span>
                    <span className="offer-type-option__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full">
                  <label>Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Subtitle</label>
                  <input type="text" value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="admin-field">
                  <label>Discount %</label>
                  <input type="number" value={form.discountPercentage} onChange={(e) => setForm(p => ({ ...p, discountPercentage: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Coupon Code</label>
                  <input type="text" value={form.couponCode} onChange={(e) => setForm(p => ({ ...p, couponCode: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Valid From *</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Valid To *</label>
                  <input type="date" value={form.validTo} onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Background Color</label>
                  <div className="color-input-wrap">
                    <input type="color" value={form.bgColor} onChange={(e) => setForm(p => ({ ...p, bgColor: e.target.value }))} />
                    <input type="text" value={form.bgColor} onChange={(e) => setForm(p => ({ ...p, bgColor: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-field">
                  <label>Text Color</label>
                  <div className="color-input-wrap">
                    <input type="color" value={form.textColor} onChange={(e) => setForm(p => ({ ...p, textColor: e.target.value }))} />
                    <input type="text" value={form.textColor} onChange={(e) => setForm(p => ({ ...p, textColor: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-field admin-field--full">
                  <label>Target URL</label>
                  <input type="text" value={form.targetUrl} onChange={(e) => setForm(p => ({ ...p, targetUrl: e.target.value }))} />
                </div>

                {/* Images */}
                <div className="admin-field admin-field--full">
                  <label>Images</label>
                  {form.existingImages && form.existingImages.length > 0 && form.images.length === 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '12px', color: '#666' }}>Current Images (Upload new files to replace these):</p>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '6px' }}>
                        {form.existingImages.map((img, i) => (
                          <img key={i} src={img} alt="Current" style={{ height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                  {form.images.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {form.images.map((img, i) => (
                        <div className="image-input-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }} key={i}>
                          <span style={{flex: 1}}>{img.name}</span>
                          <button type="button" className="image-input-remove admin-btn admin-btn--secondary" onClick={() => removeImage(i)}><FiX /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-field">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
                  </label>
                </div>
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editing ? 'Update Offer' : 'Create Offer')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
