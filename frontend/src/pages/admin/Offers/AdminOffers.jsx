import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { offers as initialOffers } from '../../../mock/offers';
import OfferRenderer from '../../../components/OfferRenderer/OfferRenderer';
import './AdminOffers.scss';

const AdminOffers = () => {
  const [offerList, setOfferList] = useState(initialOffers);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', type: 'post',
    images: [''], discount: '', couponCode: '', validUntil: '',
    active: true, bgColor: '#FF6B35', textColor: '#FFFFFF',
    productId: '', specialPrice: '',
  });

  const offerTypes = [
    { value: 'slider', label: '🎠 Image Slider', desc: 'Carousel of promotional images' },
    { value: 'fullscreen-poster', label: '🖼️ Full Screen Poster', desc: 'Full-width promotional banner' },
    { value: 'post', label: '📝 Post / Card', desc: 'Simple promotional card' },
    { value: 'buyable', label: '🛒 Buyable Product', desc: 'Product card with buy button' },
  ];

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', description: '', type: 'post', images: [''], discount: '', couponCode: '', validUntil: '', active: true, bgColor: '#FF6B35', textColor: '#FFFFFF', productId: '', specialPrice: '' });
    setShowModal(true);
  };

  const openEdit = (offer) => {
    setEditing(offer.id);
    setForm({
      title: offer.title, subtitle: offer.subtitle, description: offer.description,
      type: offer.type, images: offer.images, discount: offer.discount,
      couponCode: offer.couponCode || '', validUntil: offer.validUntil,
      active: offer.active, bgColor: offer.bgColor, textColor: offer.textColor,
      productId: offer.productId || '', specialPrice: offer.specialPrice || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this offer?')) {
      setOfferList(prev => prev.filter(o => o.id !== id));
      toast.success('Offer deleted successfully!');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const offerData = {
      ...form,
      discount: parseInt(form.discount) || 0,
      productId: form.productId ? parseInt(form.productId) : null,
      specialPrice: form.specialPrice ? parseFloat(form.specialPrice) : null,
      images: form.images.filter(Boolean),
    };

    if (editing) {
      setOfferList(prev => prev.map(o => o.id === editing ? { ...o, ...offerData } : o));
      toast.success('Offer updated successfully!');
    } else {
      setOfferList(prev => [{ ...offerData, id: Date.now() }, ...prev]);
      toast.success('Offer added successfully!');
    }
    setShowModal(false);
  };

  const addImageField = () => setForm(p => ({ ...p, images: [...p.images, ''] }));
  const updateImage = (index, value) => setForm(p => ({ ...p, images: p.images.map((img, i) => i === index ? value : img) }));
  const removeImage = (index) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  return (
    <div className="admin-offers">
      <div className="admin-offers__header">
        <h1>Offers & Promotions 🏷️</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}><FiPlus /> Add Offer</button>
      </div>

      <div className="admin-offers__grid">
        {offerList.map(offer => (
          <div className="admin-offer-card" key={offer.id}>
            <div className="admin-offer-card__header">
              <div>
                <span className={`admin-offer-card__type admin-offer-card__type--${offer.type}`}>
                  {offerTypes.find(t => t.value === offer.type)?.label || offer.type}
                </span>
                <span className={`admin-offer-card__status ${offer.active ? 'admin-offer-card__status--active' : ''}`}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="admin-actions">
                <button className="admin-action-btn admin-action-btn--edit" onClick={() => setPreview(offer)} title="Preview"><FiEye /></button>
                <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(offer)} title="Edit"><FiEdit2 /></button>
                <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(offer.id)} title="Delete"><FiTrash2 /></button>
              </div>
            </div>
            <h3 className="admin-offer-card__title">{offer.title}</h3>
            <p className="admin-offer-card__desc">{offer.subtitle}</p>
            <div className="admin-offer-card__meta">
              {offer.discount > 0 && <span className="admin-offer-card__discount">{offer.discount}% OFF</span>}
              {offer.couponCode && <span className="admin-offer-card__coupon">{offer.couponCode}</span>}
              <span className="admin-offer-card__date">Until: {new Date(offer.validUntil).toLocaleDateString()}</span>
            </div>
            <div className="admin-offer-card__colors">
              <span style={{ background: offer.bgColor }} />
              <span style={{ background: offer.textColor, border: '1px solid #ddd' }} />
            </div>
          </div>
        ))}
      </div>

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
                  <input type="number" value={form.discount} onChange={(e) => setForm(p => ({ ...p, discount: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Coupon Code</label>
                  <input type="text" value={form.couponCode} onChange={(e) => setForm(p => ({ ...p, couponCode: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm(p => ({ ...p, validUntil: e.target.value }))} />
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

                {form.type === 'buyable' && (
                  <>
                    <div className="admin-field">
                      <label>Product ID</label>
                      <input type="number" value={form.productId} onChange={(e) => setForm(p => ({ ...p, productId: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                      <label>Special Price</label>
                      <input type="number" step="0.01" value={form.specialPrice} onChange={(e) => setForm(p => ({ ...p, specialPrice: e.target.value }))} />
                    </div>
                  </>
                )}

                {/* Images */}
                <div className="admin-field admin-field--full">
                  <label>Images (URLs)</label>
                  {form.images.map((img, i) => (
                    <div className="image-input-row" key={i}>
                      <input type="text" value={img} onChange={(e) => updateImage(i, e.target.value)} placeholder={`Image URL ${i + 1}`} />
                      {form.images.length > 1 && <button type="button" className="image-input-remove" onClick={() => removeImage(i)}><FiX /></button>}
                    </div>
                  ))}
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={addImageField} style={{ marginTop: '8px' }}>
                    <FiPlus /> Add Image
                  </button>
                </div>

                <div className="admin-field">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm(p => ({ ...p, active: e.target.checked }))} /> Active
                  </label>
                </div>
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary">{editing ? 'Update' : 'Create'} Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
