import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage } from 'react-icons/fi';

import {
  useGetBannersQuery,
  useAddBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '../../../store/ActionApi/bannerApi';
import { useToast } from '../../../context/ToastContext';

const emptyForm = {
  tag: 'KIDS NEED TOYS',
  title: 'Toys That',
  highlightText: 'Spark',
  italicText: 'Joy',
  afterText: '& Imagination',
  description: '',
  buttonText: 'Shop Now',
  buttonUrl: '/shop',
  isActive: true,
  order: 0,
  imageFile: null,
  existingImage: '',
};

const AdminBanners = () => {
  const { data: resp, isFetching } = useGetBannersQuery();
  const banners = resp?.data || resp || [];
  const bannerList = Array.isArray(banners) ? banners : [];

  const [addBanner] = useAddBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      tag: banner.tag || '',
      title: banner.title || '',
      highlightText: banner.highlightText || '',
      italicText: banner.italicText || '',
      afterText: banner.afterText || '',
      description: banner.description || '',
      buttonText: banner.buttonText || 'Shop Now',
      buttonUrl: banner.buttonUrl || '/shop',
      isActive: banner.isActive ?? true,
      order: banner.order || 0,
      imageFile: null,
      existingImage: banner.image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    fd.append('tag', form.tag);
    fd.append('title', form.title);
    fd.append('highlightText', form.highlightText);
    fd.append('italicText', form.italicText);
    fd.append('afterText', form.afterText);
    if (form.description) fd.append('description', form.description);
    fd.append('buttonText', form.buttonText);
    fd.append('buttonUrl', form.buttonUrl);
    fd.append('isActive', form.isActive);
    fd.append('order', form.order);
    if (form.imageFile) fd.append('image', form.imageFile);

    try {
      if (editing) {
        await updateBanner({ id: editing._id || editing.id, formData: fd }).unwrap();
        showSuccess('Banner updated');
      } else {
        await addBanner(fd).unwrap();
        showSuccess('Banner created');
      }
      setShowModal(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id).unwrap();
      showSuccess('Banner deleted');
    } catch (err) {
      showError('Failed to delete');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Home Banners</h1>
          <p className="admin-page__subtitle">Manage the hero section on the home page</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <FiPlus /> Add Banner
        </button>
      </div>

      {isFetching ? (
        <div className="admin-loading">Loading banners...</div>
      ) : bannerList.length === 0 ? (
        <div className="admin-empty">No banners yet. Click "Add Banner" to create one.</div>
      ) : (
        <div className="admin-offer-grid">
          {bannerList.map((banner) => (
            <div className="admin-offer-card" key={banner._id || banner.id}>
              <div className="admin-offer-card__header">
                <span className={`admin-offer-card__status ${banner.isActive ? 'admin-offer-card__status--active' : ''}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="admin-actions">
                  <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(banner)}><FiEdit2 /></button>
                  <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(banner._id || banner.id)}><FiTrash2 /></button>
                </div>
              </div>
              {banner.image && (
                <img src={banner.image} alt={banner.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
              )}
              <h3 className="admin-offer-card__title">{banner.title} {banner.highlightText}</h3>
              <p className="admin-offer-card__desc">{banner.italicText} {banner.afterText}</p>
              <div className="admin-offer-card__meta">
                <span className="admin-offer-card__coupon">{banner.tag}</span>
                <span className="admin-offer-card__date">Order: {banner.order}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Banner' : 'Create Banner'}</h2>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full">
                  <label>Tag Label (e.g. "KIDS NEED TOYS")</label>
                  <input type="text" value={form.tag} onChange={(e) => setForm(p => ({ ...p, tag: e.target.value }))} />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Title (before highlight) *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Toys That" />
                </div>
                <div className="admin-field">
                  <label>Highlight Text (colored)</label>
                  <input type="text" value={form.highlightText} onChange={(e) => setForm(p => ({ ...p, highlightText: e.target.value }))} placeholder="e.g. Spark" />
                </div>
                <div className="admin-field">
                  <label>Italic Text</label>
                  <input type="text" value={form.italicText} onChange={(e) => setForm(p => ({ ...p, italicText: e.target.value }))} placeholder="e.g. Joy" />
                </div>
                <div className="admin-field admin-field--full">
                  <label>After Text</label>
                  <input type="text" value={form.afterText} onChange={(e) => setForm(p => ({ ...p, afterText: e.target.value }))} placeholder="e.g. & Imagination" />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Hero subtitle text..." />
                </div>
                <div className="admin-field">
                  <label>Button Text</label>
                  <input type="text" value={form.buttonText} onChange={(e) => setForm(p => ({ ...p, buttonText: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Button URL</label>
                  <input type="text" value={form.buttonUrl} onChange={(e) => setForm(p => ({ ...p, buttonUrl: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Display Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm(p => ({ ...p, order: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
                  </label>
                </div>
                <div className="admin-field admin-field--full">
                  <label>Hero Image</label>
                  {form.existingImage && !form.imageFile && (
                    <div style={{ marginBottom: 8 }}>
                      <img src={form.existingImage} alt="Current" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }} />
                      <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Upload new to replace</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setForm(p => ({ ...p, imageFile: e.target.files[0] }))} />
                </div>
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
