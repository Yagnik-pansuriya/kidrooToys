import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { offerTypes, initialFormState } from '../constants/offerConstants';

const OfferFormModal = ({ isOpen, onClose, onSubmit, editingOffer, isSubmitting }) => {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (editingOffer) {
        const validFrom = editingOffer.validity?.from ? new Date(editingOffer.validity.from).toISOString().split('T')[0] : '';
        const validTo = editingOffer.validity?.to ? new Date(editingOffer.validity.to).toISOString().split('T')[0] : '';
        setForm({
          title: editingOffer.title || '', subtitle: editingOffer.subtitle || '', description: editingOffer.description || '',
          type: editingOffer.type || 'post', images: [], existingImages: editingOffer.image || editingOffer.images || [], discountPercentage: editingOffer.discountPercentage || '',
          couponCode: editingOffer.couponCode || '', validFrom, validTo,
          isActive: editingOffer.isActive !== undefined ? editingOffer.isActive : true, bgColor: editingOffer.bgColor || '#FF6B35', textColor: editingOffer.textColor || '#FFFFFF',
          targetUrl: editingOffer.targetUrl || '',
        });
      } else {
        setForm(initialFormState);
      }
    }
  }, [isOpen, editingOffer]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm(p => ({ ...p, images: [...p.images, ...files] }));
  };
  
  const removeImage = (index) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
          <button onClick={onClose}><FiX /></button>
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
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferFormModal;
