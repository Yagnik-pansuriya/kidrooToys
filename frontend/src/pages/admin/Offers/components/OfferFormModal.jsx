import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiUpload, FiEye, FiImage, FiLayers, FiAlertTriangle } from 'react-icons/fi';
import { displayTypes, pageTargets, sectionPresets, positionOptions, initialOfferForm } from '../constants/offerConstants';

const todayStr = () => new Date().toISOString().split('T')[0];
const monthLaterStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

const OfferFormModal = ({ isOpen, onClose, onSubmit, editingOffer, isSubmitting }) => {
  const [form, setForm] = useState(initialOfferForm);
  const [modalStep, setModalStep] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingOffer) {
        const validFrom = editingOffer.validity?.from ? new Date(editingOffer.validity.from).toISOString().split('T')[0] : todayStr();
        const validTo = editingOffer.validity?.to ? new Date(editingOffer.validity.to).toISOString().split('T')[0] : monthLaterStr();
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
      setModalStep(1);
      setErrors({});
    }
  }, [isOpen, editingOffer]);

  const currentSections = useMemo(() => sectionPresets[form.page] || sectionPresets.custom, [form.page]);

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

  const validateStep = () => {
    const errs = {};
    if (modalStep === 1) {
      if (!form.title.trim()) errs.title = 'Title is required';
    }
    if (modalStep === 2) {
      if (!form.validFrom) errs.validFrom = 'Start date is required';
      if (!form.validTo) errs.validTo = 'End date is required';
      if (form.validFrom && form.validTo && form.validTo < form.validFrom) {
        errs.validTo = 'End date must be after start date';
      }
      if (form.validTo && form.validTo < todayStr()) {
        errs.validTo = 'End date cannot be in the past';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep() && modalStep < 3) setModalStep(s => s + 1); };
  const prevStep = () => { if (modalStep > 1) setModalStep(s => s - 1); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    const cleanForm = {
      ...form,
      bgColor: /^#[0-9A-Fa-f]{6}$/.test(form.bgColor) ? form.bgColor : '#FF6B35',
      textColor: /^#[0-9A-Fa-f]{6}$/.test(form.textColor) ? form.textColor : '#FFFFFF',
    };
    onSubmit(cleanForm);
  };

  if (!isOpen) return null;

  const bgColor = /^#[0-9A-Fa-f]{6}$/.test(form.bgColor) ? form.bgColor : '#FF6B35';
  const textColor = /^#[0-9A-Fa-f]{6}$/.test(form.textColor) ? form.textColor : '#FFFFFF';

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        
        <div className="modal-body">
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 1 ? 'var(--primary)' : '#EEE' }}></div>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 2 ? 'var(--primary)' : '#EEE' }}></div>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 3 ? 'var(--primary)' : '#EEE' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Step {modalStep} of 3 — {modalStep === 1 ? 'Choose offer type & content' : modalStep === 2 ? 'Set display & validity' : 'Styling & Review'}
          </div>

          <form id="offerForm" onSubmit={handleSubmit}>
            
            {/* STEP 1: Content */}
            <div style={{ display: modalStep === 1 ? 'block' : 'none' }}>
              <div className="section-divider">Select Display Type</div>
              <div className="offer-type-picker">
                {displayTypes.map(t => (
                  <div key={t.value}
                    className={`type-opt ${form.displayType === t.value ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, displayType: t.value, images: [] }))}
                  >
                    <div className="type-icon">{t.value === 'single-banner' ? '🖼️' : '📦'}</div>
                    <div className="type-name">{t.label}</div>
                  </div>
                ))}
              </div>

              <div className="section-divider">Basic Details</div>
              <div className="form-group">
                <label>Offer Title *</label>
                <input type="text" value={form.title} placeholder="e.g. Summer Flash Sale"
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
                {errors.title && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.title}</span>}
              </div>
              <div className="form-group">
                <label>Subtitle</label>
                <input type="text" value={form.subtitle} placeholder="e.g. Limited time offer"
                  onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} placeholder="Optional detailed description..." rows={2}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Click-through URL</label>
                <input type="text" placeholder="/shop or https://..." value={form.targetUrl}
                  onChange={(e) => setForm(p => ({ ...p, targetUrl: e.target.value }))} />
              </div>
            </div>

            {/* STEP 2: Placement & Validity */}
            <div style={{ display: modalStep === 2 ? 'block' : 'none' }}>
              <div className="section-divider">Where to Display this Offer?</div>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Target Page *</label>
                  <select value={form.page} onChange={(e) => handlePageChange(e.target.value)}>
                    {pageTargets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Section / Placement *</label>
                  <select value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))}>
                    {currentSections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Display Order / Priority</label>
                <select value={form.position} onChange={(e) => setForm(p => ({ ...p, position: parseInt(e.target.value) }))}>
                  {positionOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="section-divider">Validity</div>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Valid From *</label>
                  <input type="date" value={form.validFrom} min={todayStr()}
                    onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} />
                  {errors.validFrom && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.validFrom}</span>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Valid To *</label>
                  <input type="date" value={form.validTo} min={form.validFrom || todayStr()}
                    onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} />
                  {errors.validTo && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.validTo}</span>}
                </div>
              </div>

              <div className="section-divider">Options</div>
              <div className="check-row">
                <input type="checkbox" id="chk_active" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="chk_active">Make offer active immediately</label>
              </div>
            </div>

            {/* STEP 3: Styling & Review */}
            <div style={{ display: modalStep === 3 ? 'block' : 'none' }}>
              <div className="section-divider">Styling</div>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Background Color</label>
                  <div className="color-picker-wrap">
                    <input type="color" value={bgColor} onChange={(e) => setForm(p => ({ ...p, bgColor: e.target.value }))} />
                    <span className="color-picker-hex">{bgColor}</span>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Text Color</label>
                  <div className="color-picker-wrap">
                    <input type="color" value={textColor} onChange={(e) => setForm(p => ({ ...p, textColor: e.target.value }))} />
                    <span className="color-picker-hex">{textColor}</span>
                  </div>
                </div>
              </div>

              <div className="section-divider">Upload Images</div>
              {form.existingImages && form.existingImages.length > 0 && form.images.length === 0 && (
                <div className="offer-existing-images">
                  <div className="offer-existing-images__label">Current image(s):</div>
                  <div className="offer-existing-images__grid">
                    {form.existingImages.map((img, i) => <img key={i} src={img.url || img} alt="Current" className="offer-existing-images__thumb" />)}
                  </div>
                </div>
              )}
              <div className="offer-upload-area">
                <FiUpload size={24} />
                <span style={{ marginTop: '4px' }}>Click or drag to upload {form.displayType === 'single-banner' ? 'an image' : 'multiple images'}</span>
                <input type="file" multiple={form.displayType === 'slider'} accept="image/*" onChange={handleImageChange} />
              </div>
              {form.images.length > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--success)' }}>✅ {form.images.length} image(s) selected</div>
              )}

              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: '14px', marginTop: '20px', fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
                ✅ Review your offer settings. Once saved, this offer will appear on the selected pages based on your validity dates.
              </div>
            </div>

          </form>
        </div>
        
        <div className="modal-footer">
          {modalStep > 1 && (
            <button className="btn btn-outline" type="button" onClick={prevStep}>← Back</button>
          )}
          {modalStep < 3 ? (
            <button className="btn btn-primary" type="button" onClick={nextStep}>Next →</button>
          ) : (
            <button className="btn btn-primary" type="submit" form="offerForm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : '✅ Save Offer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferFormModal;
