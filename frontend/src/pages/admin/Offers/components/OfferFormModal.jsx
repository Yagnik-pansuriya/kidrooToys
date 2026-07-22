import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiUpload, FiCheck, FiLayers, FiCalendar, FiImage, FiGrid, FiLink, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
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

  const validateStep = () => {
    const errs = {};
    if (modalStep === 1) {
      if (!form.title.trim()) errs.title = 'Offer Title is required';
    }
    if (modalStep === 2) {
      if (!form.validFrom) errs.validFrom = 'Start date is required';
      if (!form.validTo) errs.validTo = 'End date is required';
      if (form.validFrom && form.validTo && form.validTo < form.validFrom) {
        errs.validTo = 'End date must be after start date';
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
      <div className="offer-modal premium-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon">🌟</div>
            <div>
              <h2>{editingOffer ? 'Edit Offer Banner' : 'Create New Offer'}</h2>
              <p>Design promotional banners, placement target pages, and schedule validity</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="modal-stepper-bar">
          <div className={`stepper-step ${modalStep >= 1 ? 'active' : ''} ${modalStep > 1 ? 'completed' : ''}`} onClick={() => modalStep > 1 && setModalStep(1)}>
            <div className="step-circle">{modalStep > 1 ? <FiCheck /> : 1}</div>
            <span className="step-text">Content & Format</span>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${modalStep >= 2 ? 'active' : ''} ${modalStep > 2 ? 'completed' : ''}`} onClick={() => modalStep > 2 && setModalStep(2)}>
            <div className="step-circle">{modalStep > 2 ? <FiCheck /> : 2}</div>
            <span className="step-text">Placement & Dates</span>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${modalStep === 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-text">Styling & Upload</span>
          </div>
        </div>

        <div className="modal-body">
          <form id="offerForm" onSubmit={handleSubmit}>
            
            {/* STEP 1: Content */}
            {modalStep === 1 && (
              <div className="step-content">
                <div className="section-title-badge">DISPLAY TYPE FORMAT</div>
                <div className="display-type-grid">
                  {displayTypes.map(t => (
                    <div 
                      key={t.value}
                      className={`type-card ${form.displayType === t.value ? 'selected' : ''}`}
                      onClick={() => setForm(p => ({ ...p, displayType: t.value, images: [] }))}
                    >
                      <div className="type-card-icon">{t.value === 'single-banner' ? '🖼️' : t.value === 'slider' ? '🎠' : t.value === 'top-banner' ? '📢' : '🎁'}</div>
                      <div className="type-card-label">{t.label}</div>
                      {form.displayType === t.value && <div className="card-check-badge"><FiCheck /></div>}
                    </div>
                  ))}
                </div>

                <div className="section-title-badge" style={{ marginTop: '24px' }}>OFFER CONTENT & LINKS</div>
                
                <div className="form-group">
                  <label className="form-label">Offer Title <span className="req">*</span></label>
                  <input 
                    type="text" 
                    value={form.title} 
                    placeholder="e.g. Summer Flash Sale — Up to 40% Off"
                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} 
                  />
                  {errors.title && <span className="form-error-msg">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Subtitle / Sub-heading</label>
                  <input 
                    type="text" 
                    value={form.subtitle} 
                    placeholder="e.g. Premium Toy Collections at Unbeatable Prices"
                    onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Announcement text</label>
                  <textarea 
                    value={form.description} 
                    placeholder="Detailed terms, highlight points, or promo offer description..." 
                    rows={3}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><FiLink className="icon-inline" /> Target Destination URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. /shop?category=educational or https://..." 
                    value={form.targetUrl}
                    onChange={(e) => setForm(p => ({ ...p, targetUrl: e.target.value }))} 
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Placement & Validity */}
            {modalStep === 2 && (
              <div className="step-content">
                <div className="section-title-badge"><FiGrid className="icon-inline" /> PAGE PLACEMENT & POSITION</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Page <span className="req">*</span></label>
                    <select value={form.page} onChange={(e) => handlePageChange(e.target.value)}>
                      {pageTargets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Section Placement <span className="req">*</span></label>
                    <select value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))}>
                      {currentSections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order Position</label>
                  <select value={form.position} onChange={(e) => setForm(p => ({ ...p, position: parseInt(e.target.value) }))}>
                    {positionOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <div className="section-title-badge" style={{ marginTop: '24px' }}><FiCalendar className="icon-inline" /> VALIDITY DATES</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valid From <span className="req">*</span></label>
                    <input 
                      type="date" 
                      value={form.validFrom} 
                      min={todayStr()}
                      onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} 
                    />
                    {errors.validFrom && <span className="form-error-msg">{errors.validFrom}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valid Until <span className="req">*</span></label>
                    <input 
                      type="date" 
                      value={form.validTo} 
                      min={form.validFrom || todayStr()}
                      onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} 
                    />
                    {errors.validTo && <span className="form-error-msg">{errors.validTo}</span>}
                  </div>
                </div>

                <label className="toggle-switch-row" style={{ marginTop: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} 
                  />
                  <div className="toggle-slider"></div>
                  <span className="toggle-label">Make offer active immediately</span>
                </label>
              </div>
            )}

            {/* STEP 3: Styling & Review */}
            {modalStep === 3 && (
              <div className="step-content">
                <div className="section-title-badge">THEME & COLORS</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Background Color</label>
                    <div className="color-picker-wrap">
                      <input type="color" value={bgColor} onChange={(e) => setForm(p => ({ ...p, bgColor: e.target.value }))} />
                      <span className="color-picker-hex">{bgColor}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Text Color</label>
                    <div className="color-picker-wrap">
                      <input type="color" value={textColor} onChange={(e) => setForm(p => ({ ...p, textColor: e.target.value }))} />
                      <span className="color-picker-hex">{textColor}</span>
                    </div>
                  </div>
                </div>

                <div className="section-title-badge" style={{ marginTop: '24px' }}><FiImage className="icon-inline" /> BANNER IMAGES</div>
                
                {form.existingImages && form.existingImages.length > 0 && form.images.length === 0 && (
                  <div className="offer-existing-images">
                    <div className="offer-existing-images__label">Current active image:</div>
                    <div className="offer-existing-images__grid">
                      {form.existingImages.map((img, i) => <img key={i} src={img.url || img} alt="Current" className="offer-existing-images__thumb" />)}
                    </div>
                  </div>
                )}

                <div className="offer-upload-area">
                  <FiUpload size={28} className="upload-icon-pulse" />
                  <div className="upload-title">Click or drag banner images here</div>
                  <div className="upload-sub">Supports PNG, JPG, WEBP (Max 5MB)</div>
                  <input type="file" multiple={form.displayType === 'slider'} accept="image/*" onChange={handleImageChange} />
                </div>

                {form.images.length > 0 && (
                  <div className="selected-count-pill" style={{ marginTop: '10px' }}>
                    ✓ {form.images.length} image(s) ready to upload
                  </div>
                )}

                {/* Banner Live Preview Box */}
                <div className="banner-preview-box" style={{ background: bgColor, color: textColor, marginTop: '20px' }}>
                  <div className="preview-label">BANNER LIVE PREVIEW</div>
                  <div className="preview-title">{form.title || 'Offer Banner Title'}</div>
                  <div className="preview-subtitle">{form.subtitle || 'Offer subtitle text goes here'}</div>
                </div>
              </div>
            )}

          </form>
        </div>
        
        {/* Footer Bar */}
        <div className="modal-footer">
          {modalStep > 1 && (
            <button className="btn btn-outline" type="button" onClick={prevStep}>
              <FiArrowLeft /> Back
            </button>
          )}
          {modalStep < 3 ? (
            <button className="btn btn-primary btn-pills" type="button" onClick={nextStep}>
              Next Step <FiArrowRight />
            </button>
          ) : (
            <button className="btn btn-primary btn-pills" type="submit" form="offerForm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Offer...' : '✓ Save & Publish Offer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferFormModal;
