import React, { useState, useEffect } from 'react';
import { FiX, FiImage, FiCheckCircle, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { slugify } from '../../../../utils/slugify';

const emptyForm = {
  catagoryName: '',
  slug: '',
  description: '',
  count: 0,
  image: null,
  icon: null,
  previewImage: null,
  previewIcon: null,
};

const CategoryFormModal = ({ isOpen, onClose, onSubmit, editingCategory, isSubmitting, apiError }) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setForm({
          catagoryName: editingCategory.catagoryName || '',
          slug: editingCategory.slug || '',
          description: editingCategory.description || '',
          count: editingCategory.count ?? 0,
          image: null,
          icon: null,
          previewImage: editingCategory.image || null,
          previewIcon: editingCategory.icon || null,
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [isOpen, editingCategory]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, image: file, previewImage: URL.createObjectURL(file) }));
    }
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, icon: file, previewIcon: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal category-form" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <button onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>

        <form className="admin-modal__form" onSubmit={handleSubmit}>
          {apiError && (
            <div className="admin-form-alert" role="alert">
              <FiAlertCircle aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="admin-form-grid">
            {/* Category Name */}
            <div className="admin-field admin-field--full">
              <label>Category Name *</label>
              <input
                type="text"
                value={form.catagoryName}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((p) => ({
                    ...p,
                    catagoryName: name,
                    // Auto-generate slug from name (only if slug hasn't been manually edited or is still auto-synced)
                    slug: slugify(name),
                  }));
                }}
                placeholder="e.g. Wooden Toys"
                required
              />
            </div>

            {/* Slug */}
            <div className="admin-field admin-field--full">
              <label>Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="e.g. wooden-toys"
                required
              />
              <p className="admin-field__hint">
                Auto-generated from name. Used in URL: /category/{form.slug || 'your-slug'}
              </p>
            </div>
            {/* Description (Optional) */}
            <div className="admin-field admin-field--full">
              <label>Description <span className="category-form__optional">(Optional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this category for SEO and display..."
                rows={3}
              />
            </div>

            {/* Cover Image */}
            <div className="admin-field admin-field--full">
              <label><FiImage /> Cover Image</label>
              <input
                type="file"
                accept="image/*"
                className="category-form__file"
                onChange={handleImageChange}
              />
              {form.previewImage && (
                <img src={form.previewImage} alt="Preview Image" className="category-form__preview" />
              )}
            </div>

            {/* Icon */}
            <div className="admin-field admin-field--full">
              <label><FiCheckCircle /> Icon</label>
              <input
                type="file"
                accept="image/*"
                className="category-form__file"
                onChange={handleIconChange}
              />
              {form.previewIcon && (
                <img src={form.previewIcon} alt="Preview Icon" className="category-form__preview category-form__preview--icon" />
              )}
            </div>
          </div>

          <div className="admin-modal__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><FiLoader className="spin" /> Saving…</>
                : <>{editingCategory ? 'Update' : 'Add'} Category</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
