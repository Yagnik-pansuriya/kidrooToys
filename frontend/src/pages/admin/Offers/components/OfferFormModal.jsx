import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiUpload, FiEye, FiImage, FiLayers, FiAlertTriangle } from 'react-icons/fi';
import { displayTypes, pageTargets, sectionPresets, positionOptions, initialOfferForm } from '../constants/offerConstants';

// Helper: get today's date as YYYY-MM-DD
const todayStr = () => new Date().toISOString().split('T')[0];
const monthLaterStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

const OfferFormModal = ({ isOpen, onClose, onSubmit, editingOffer, isSubmitting }) => {
  const [form, setForm] = useState(initialOfferForm);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingOffer) {
        const validFrom = editingOffer.validity?.from ? new Date(editingOffer.validity.from).toISOString().split('T')[0] : todayStr();
        const validTo = editingOffer.validity?.to ? new Date(editingOffer.validity.to).toISOString().split('T')[0] : monthLaterStr();
        // Validate existing colors, fallback to defaults
        const bgColor = /^#[0-9A-Fa-f]{3,6}$/.test(editingOffer.styling?.bgColor) ? editingOffer.styling.bgColor : '#FF6B35';
        const textColor = /^#[0-9A-Fa-f]{3,6}$/.test(editingOffer.styling?.textColor) ? editingOffer.styling.textColor : '#FFFFFF';
        setForm({
          title: editingOffer.title || '',
          subtitle: editingOffer.subtitle || '',
          description: editingOffer.description || '',
          displayType: editingOffer.displayType || 'single-banner',
          page: editingOffer.placement?.page || 'home',
          section: editingOffer.placement?.section || 'hero',
          position: editingOffer.placement?.position ?? 1,
          images: [],
          existingImages: (editingOffer.images || []).map(img => typeof img === 'string' ? { url: img } : img),
          imageAltTexts: (editingOffer.images || []).map(img => img.altText || ''),
          imageLinks: (editingOffer.images || []).map(img => img.link || ''),
          bgColor,
          textColor,
          overlayOpacity: editingOffer.styling?.overlayOpacity || 0,
          targetUrl: editingOffer.targetUrl || '',
          validFrom,
          validTo,
          isActive: editingOffer.isActive !== undefined ? editingOffer.isActive : true,
        });
      } else {
        setForm({ ...initialOfferForm, validFrom: todayStr(), validTo: monthLaterStr() });
      }
      setShowPreview(false);
      setErrors({});
    }
  }, [isOpen, editingOffer]);

  // Get section options based on selected page
  const currentSections = useMemo(() => {
    return sectionPresets[form.page] || sectionPresets.custom;
  }, [form.page]);

  // When page changes, reset section to first available
  const handlePageChange = (newPage) => {
    const sections = sectionPresets[newPage] || sectionPresets.custom;
    setForm(p => ({ ...p, page: newPage, section: sections[0]?.value || 'main' }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (form.displayType === 'single-banner') {
      setForm(p => ({
        ...p,
        images: [files[0]],
        imageAltTexts: [''],
        imageLinks: [''],
      }));
    } else {
      setForm(p => ({
        ...p,
        images: [...p.images, ...files],
        imageAltTexts: [...p.imageAltTexts, ...files.map(() => '')],
        imageLinks: [...p.imageLinks, ...files.map(() => '')],
      }));
    }
  };

  const removeImage = (index) => {
    setForm(p => ({
      ...p,
      images: p.images.filter((_, i) => i !== index),
      imageAltTexts: p.imageAltTexts.filter((_, i) => i !== index),
      imageLinks: p.imageLinks.filter((_, i) => i !== index),
    }));
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.validFrom) errs.validFrom = 'Start date is required';
    if (!form.validTo) errs.validTo = 'End date is required';
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) {
      errs.validTo = 'End date must be after start date';
    }
    if (form.validTo && form.validTo < todayStr()) {
      errs.validTo = 'End date cannot be in the past';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Force valid hex colors before submit
    const cleanForm = {
      ...form,
      bgColor: /^#[0-9A-Fa-f]{6}$/.test(form.bgColor) ? form.bgColor : '#FF6B35',
      textColor: /^#[0-9A-Fa-f]{6}$/.test(form.textColor) ? form.textColor : '#FFFFFF',
    };
    onSubmit(cleanForm);
  };

  // Get section label for preview
  const getSectionLabel = () => {
    const sec = currentSections.find(s => s.value === form.section);
    return sec?.label || form.section;
  };

  const getPageLabel = () => {
    const pg = pageTargets.find(p => p.value === form.page);
    return pg?.label || form.page;
  };

  if (!isOpen) return null;

  const bgColor = /^#[0-9A-Fa-f]{6}$/.test(form.bgColor) ? form.bgColor : '#FF6B35';
  const textColor = /^#[0-9A-Fa-f]{6}$/.test(form.textColor) ? form.textColor : '#FFFFFF';

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="offer-preview-toggle" onClick={() => setShowPreview(!showPreview)}>
              <FiEye /> {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button onClick={onClose}><FiX /></button>
          </div>
        </div>

        <form className="admin-modal__form" onSubmit={handleSubmit}>

          {/* ═══ STEP 1: Display Type ═══ */}
          <div className="offer-step">
            <div className="offer-step__label">Step 1 — Choose Display Type</div>
            <div className="offer-type-grid">
              {displayTypes.map(t => (
                <button key={t.value} type="button"
                  className={`offer-type-option ${form.displayType === t.value ? 'offer-type-option--active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, displayType: t.value, images: [] }))}
                >
                  <span className="offer-type-option__icon">
                    {t.value === 'single-banner' ? <FiImage size={22} /> : <FiLayers size={22} />}
                  </span>
                  <span className="offer-type-option__label">{t.label}</span>
                  <span className="offer-type-option__desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ STEP 2: Placement ═══ */}
          <div className="offer-step">
            <div className="offer-step__label">Step 2 — Where should this offer appear?</div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Target Page *</label>
                <select value={form.page} onChange={(e) => handlePageChange(e.target.value)}>
                  {pageTargets.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>Section / Placement *</label>
                <select value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))}>
                  {currentSections.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {currentSections.find(s => s.value === form.section)?.desc && (
                  <span className="admin-field__hint">
                    {currentSections.find(s => s.value === form.section)?.desc}
                  </span>
                )}
              </div>
              <div className="admin-field">
                <label>Display Order / Priority</label>
                <select value={form.position} onChange={(e) => setForm(p => ({ ...p, position: parseInt(e.target.value) }))}>
                  {positionOptions.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Placement preview chip */}
            <div className="offer-placement-preview">
              <span className="offer-placement-preview__chip">
                📍 {getPageLabel()} → {getSectionLabel()} → Position #{form.position}
              </span>
            </div>
          </div>

          {/* ═══ STEP 3: Content ═══ */}
          <div className="offer-step">
            <div className="offer-step__label">Step 3 — Offer Content</div>
            <div className="admin-form-grid">
              <div className="admin-field admin-field--full">
                <label>Title *</label>
                <input type="text" value={form.title} placeholder="e.g. Summer Sale - 50% Off!"
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
                {errors.title && <span className="admin-field__error">{errors.title}</span>}
              </div>
              <div className="admin-field admin-field--full">
                <label>Subtitle</label>
                <input type="text" value={form.subtitle} placeholder="e.g. Limited time offer on all toys"
                  onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Description</label>
                <textarea value={form.description} placeholder="Optional detailed description..."
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Click-through URL</label>
                <input type="text" placeholder="/shop or /offers or https://..." value={form.targetUrl}
                  onChange={(e) => setForm(p => ({ ...p, targetUrl: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ═══ STEP 4: Styling & Dates ═══ */}
          <div className="offer-step">
            <div className="offer-step__label">Step 4 — Styling & Dates</div>
            <div className="admin-form-grid">
              {/* Colors: ONLY color picker, no text input for garbage */}
              <div className="admin-field">
                <label>Background Color</label>
                <div className="color-picker-wrap">
                  <input type="color" value={bgColor}
                    onChange={(e) => setForm(p => ({ ...p, bgColor: e.target.value }))} />
                  <span className="color-picker-hex">{bgColor}</span>
                </div>
              </div>
              <div className="admin-field">
                <label>Text Color</label>
                <div className="color-picker-wrap">
                  <input type="color" value={textColor}
                    onChange={(e) => setForm(p => ({ ...p, textColor: e.target.value }))} />
                  <span className="color-picker-hex">{textColor}</span>
                </div>
              </div>

              {/* Dates with min enforcement */}
              <div className="admin-field">
                <label>Valid From *</label>
                <input type="date" value={form.validFrom}
                  min={todayStr()}
                  onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} required />
                {errors.validFrom && <span className="admin-field__error">{errors.validFrom}</span>}
              </div>
              <div className="admin-field">
                <label>Valid To *</label>
                <input type="date" value={form.validTo}
                  min={form.validFrom || todayStr()}
                  onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} required />
                {errors.validTo && <span className="admin-field__error">{errors.validTo}</span>}
              </div>
            </div>

            {/* Date validation warning */}
            {form.validTo && form.validTo < todayStr() && (
              <div className="offer-date-warning">
                <FiAlertTriangle /> End date is in the past — this offer will NOT be visible to users!
              </div>
            )}
          </div>

          {/* ═══ STEP 5: Images ═══ */}
          <div className="offer-step">
            <div className="offer-step__label">
              Step 5 — Upload {form.displayType === 'single-banner' ? 'Image' : 'Images'}
            </div>

            {form.existingImages && form.existingImages.length > 0 && form.images.length === 0 && (
              <div className="offer-existing-images">
                <p className="offer-existing-images__label">Current image(s) — upload new to replace:</p>
                <div className="offer-existing-images__grid">
                  {form.existingImages.map((img, i) => (
                    <img key={i} src={img.url || img} alt="Current" className="offer-existing-images__thumb" />
                  ))}
                </div>
              </div>
            )}

            <div className="offer-upload-area">
              <FiUpload size={24} />
              <span>{form.displayType === 'single-banner'
                ? 'Click or drag to upload a single image'
                : 'Click or drag to upload multiple images'}</span>
              <input type="file" multiple={form.displayType === 'slider'} accept="image/*" onChange={handleImageChange} />
            </div>

            {form.images.length > 0 && (
              <div className="offer-new-images">
                {form.images.map((img, i) => (
                  <div className="offer-new-images__item" key={i}>
                    <span className="offer-new-images__name">📎 {img.name}</span>
                    <button type="button" className="offer-new-images__remove" onClick={() => removeImage(i)}>
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Active Toggle ═══ */}
          <div className="admin-field">
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active (visible to users)
            </label>
          </div>

          {/* ═══ LIVE PREVIEW ═══ */}
          {showPreview && (
            <div className="offer-live-preview">
              <div className="offer-live-preview__label">
                <FiEye /> Live Preview — {getPageLabel()} → {getSectionLabel()}
              </div>
              <div className="offer-live-preview__frame">
                <div className="offer-live-preview__page">
                  <div className="offer-live-preview__placeholder offer-live-preview__placeholder--header">
                    ← Header / Navbar
                  </div>

                  {(form.section === 'top-strip') && (
                    <div className="offer-live-preview__strip" style={{ background: bgColor, color: textColor }}>
                      <strong>{form.title || 'Offer Title'}</strong>
                      {form.subtitle && <span> — {form.subtitle}</span>}
                    </div>
                  )}

                  {(form.section === 'hero' || form.section === 'top-banner') && (
                    <div className="offer-live-preview__hero" style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`, color: textColor }}>
                      {form.existingImages?.[0]?.url && (
                        <img src={form.existingImages[0].url} alt="" className="offer-live-preview__hero-img" />
                      )}
                      <div>
                        <strong style={{ fontSize: '1rem' }}>{form.title || 'Offer Title'}</strong>
                        {form.subtitle && <p style={{ fontSize: '0.7rem', opacity: 0.85, margin: '2px 0' }}>{form.subtitle}</p>}
                      </div>
                    </div>
                  )}

                  <div className="offer-live-preview__placeholder">
                    ← Page Content Area
                  </div>

                  {(form.section === 'below-hero' || form.section === 'between-categories' || form.section === 'between-products' || form.section === 'below-gallery') && (
                    <div className="offer-live-preview__banner" style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}bb)`, color: textColor }}>
                      <strong>{form.title || 'Offer Title'}</strong>
                      {form.subtitle && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}> — {form.subtitle}</span>}
                    </div>
                  )}

                  <div className="offer-live-preview__placeholder">
                    ← More Content
                  </div>

                  {(form.section === 'before-footer' || form.section === 'related-section' || form.section === 'featured' || form.section === 'grid') && (
                    <div className="offer-live-preview__banner" style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}bb)`, color: textColor }}>
                      <strong>{form.title || 'Offer Title'}</strong>
                    </div>
                  )}

                  <div className="offer-live-preview__placeholder offer-live-preview__placeholder--footer">
                    ← Footer
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="admin-modal__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferFormModal;
