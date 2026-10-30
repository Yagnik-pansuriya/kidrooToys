import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiX, FiUpload, FiCheck, FiCalendar, FiImage, FiGrid, FiLink, FiArrowRight, FiArrowLeft, FiTrash2, FiType } from 'react-icons/fi';
import {
  displayTypes, pageTargets, sectionPresets, positionOptions, initialOfferForm, toLocalInput, OFFERS_PAGE_NOTE,
} from '../constants/offerConstants';
import { OfferSlotPreview } from '../../../../components/OfferSlot/OfferSlot';

const MAX_FILE_MB = 5;
const MAX_SLIDER_IMAGES = 10;
const HEX6 = /^#[0-9A-Fa-f]{6}$/;

const STEPS = [
  { n: 1, label: 'Content' },
  { n: 2, label: 'Images & Style' },
  { n: 3, label: 'Placement & Schedule' },
];

const daysFrom = (start, days) => {
  const d = start ? new Date(start) : new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return toLocalInput(d);
};

const OfferFormModal = ({ isOpen, onClose, onSubmit, editingOffer, isSubmitting }) => {
  const [form, setForm] = useState(initialOfferForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!isOpen) return;
    if (editingOffer) {
      set({
        title: editingOffer.title || '',
        subtitle: editingOffer.subtitle || '',
        description: editingOffer.description || '',
        badgeText: editingOffer.badgeText || '',
        ctaText: editingOffer.ctaText || '',
        displayType: editingOffer.displayType === 'slider' ? 'slider' : 'single-banner',
        page: pageTargets.some((p) => p.value === editingOffer.placement?.page) ? editingOffer.placement.page : 'home',
        section: editingOffer.placement?.section || 'hero',
        position: editingOffer.placement?.position || 1,
        existingImages: (editingOffer.images || []).map((img) =>
          typeof img === 'string' ? { url: img, altText: '', link: '' } : { url: img.url, altText: img.altText || '', link: img.link || '' }),
        newImages: [],
        bgColor: HEX6.test(editingOffer.styling?.bgColor) ? editingOffer.styling.bgColor : '#FF6B35',
        textColor: HEX6.test(editingOffer.styling?.textColor) ? editingOffer.styling.textColor : '#FFFFFF',
        overlayOpacity: editingOffer.styling?.overlayOpacity || 0,
        targetUrl: editingOffer.targetUrl || '',
        validFrom: toLocalInput(editingOffer.validity?.from),
        validTo: toLocalInput(editingOffer.validity?.to),
        isActive: editingOffer.isActive !== undefined ? editingOffer.isActive : true,
      });
    } else {
      setForm({ ...initialOfferForm, validFrom: toLocalInput(new Date()), validTo: daysFrom(null, 30) });
    }
    setStep(1);
    setErrors({});
  }, [isOpen, editingOffer]);

  // Blob URLs for picked files, released when the modal closes
  const blobUrls = useRef([]);
  useEffect(() => {
    if (isOpen) return undefined;
    blobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrls.current = [];
    return undefined;
  }, [isOpen]);
  useEffect(() => () => blobUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const sections = sectionPresets[form.page] || [];
  const isSlider = form.displayType === 'slider';
  const totalImages = form.existingImages.length + form.newImages.length;

  // ── Images ────────────────────────────────────────────────────
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const tooBig = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024 && f.type.startsWith('image/'));
    const errs = {};
    if (tooBig.length) errs.images = `${tooBig.map((f) => f.name).join(', ')} is over ${MAX_FILE_MB}MB`;
    if (ok.length === 0) { setErrors((e) => ({ ...e, ...errs })); return; }

    const picked = ok.map((file) => ({ file, preview: URL.createObjectURL(file), altText: '', link: '' }));
    blobUrls.current.push(...picked.map((p) => p.preview));
    if (!isSlider) {
      // Single banner: the new image replaces whatever was there
      set({ existingImages: [], newImages: picked.slice(0, 1) });
    } else {
      const room = MAX_SLIDER_IMAGES - totalImages;
      if (picked.length > room) errs.images = `A slider holds up to ${MAX_SLIDER_IMAGES} images`;
      set({ newImages: [...form.newImages, ...picked.slice(0, Math.max(0, room))] });
    }
    setErrors((e) => ({ ...e, images: errs.images }));
  };

  const updateExisting = (i, patch) => set({ existingImages: form.existingImages.map((img, j) => (j === i ? { ...img, ...patch } : img)) });
  const updateNew = (i, patch) => set({ newImages: form.newImages.map((img, j) => (j === i ? { ...img, ...patch } : img)) });
  const removeExisting = (i) => set({ existingImages: form.existingImages.filter((_, j) => j !== i) });
  const removeNew = (i) => set({ newImages: form.newImages.filter((_, j) => j !== i) });

  const changeDisplayType = (value) => {
    if (value === form.displayType) return;
    // Going back to a single banner keeps only the first image
    if (value !== 'slider' && totalImages > 1) {
      const keepExisting = form.existingImages.slice(0, 1);
      set({ displayType: value, existingImages: keepExisting, newImages: keepExisting.length ? [] : form.newImages.slice(0, 1) });
    } else {
      set({ displayType: value });
    }
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = (upTo) => {
    const errs = {};
    if (upTo >= 1) {
      if (!form.title.trim()) errs.title = 'Offer title is required';
      if (form.targetUrl && !/^(\/|https?:\/\/)/i.test(form.targetUrl.trim())) {
        errs.targetUrl = 'Use a site path like /shop?category=puzzles or a full https:// link';
      }
    }
    if (upTo >= 2 && isSlider && totalImages < 2) {
      errs.images = 'A slider needs at least 2 images — or switch to Single Banner';
    }
    if (upTo >= 3) {
      if (!form.validFrom) errs.validFrom = 'Start date is required';
      if (!form.validTo) errs.validTo = 'End date is required';
      if (form.validFrom && form.validTo && new Date(form.validTo) <= new Date(form.validFrom)) {
        errs.validTo = 'End must be after start';
      }
      if (!editingOffer && form.validTo && new Date(form.validTo) < new Date()) {
        errs.validTo = 'This end date is already in the past';
      }
    }
    setErrors(errs);
    const firstBad = errs.title || errs.targetUrl ? 1 : errs.images ? 2 : Object.keys(errs).length ? 3 : 0;
    if (firstBad && firstBad < step) setStep(firstBad);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate(step)) setStep((s) => Math.min(3, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));
  const goTo = (n) => { if (n < step || validate(n - 1)) setStep(n); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) { next(); return; }
    if (!validate(3)) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      targetUrl: form.targetUrl.trim(),
      // Send real instants so the server stores exactly what the admin picked
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
    });
  };

  // ── Live preview (same component the storefront uses) ─────────
  const draft = useMemo(() => ({
    _id: 'preview',
    title: form.title || 'Your offer title',
    subtitle: form.subtitle,
    description: form.description,
    badgeText: form.badgeText,
    ctaText: form.ctaText,
    displayType: form.displayType,
    targetUrl: form.targetUrl,
    placement: { page: form.page, section: form.section, position: form.position },
    images: [...form.existingImages, ...form.newImages.map((n) => ({ url: n.preview, altText: n.altText }))],
    styling: { bgColor: form.bgColor, textColor: form.textColor, overlayOpacity: form.overlayOpacity },
    validity: { from: form.validFrom, to: form.validTo },
  }), [form]);

  if (!isOpen) return null;

  const scheduleNote = (() => {
    if (!form.validFrom || !form.validTo) return '';
    const from = new Date(form.validFrom);
    const to = new Date(form.validTo);
    const days = Math.max(0, Math.round((to - from) / 86400000));
    const when = from > new Date() ? 'Goes live automatically on' : 'Live from';
    return `${when} ${from.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} for ${days} day${days === 1 ? '' : 's'}.`;
  })();

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal premium-modal offer-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon">🌟</div>
            <div>
              <h2>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
              <p>The preview shows exactly what shoppers will see</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="modal-stepper-bar">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <div className="stepper-line" />}
              <button
                type="button"
                className={`stepper-step ${step >= s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`}
                onClick={() => goTo(s.n)}
              >
                <div className="step-circle">{step > s.n ? <FiCheck /> : s.n}</div>
                <span className="step-text">{s.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="modal-body offer-form-layout">
          <form id="offerForm" className="offer-form-fields" onSubmit={handleSubmit} noValidate>
            {step === 1 && (
              <div className="step-content">
                <div className="section-title-badge"><FiType className="icon-inline" /> WHAT THE BANNER SAYS</div>

                <div className="form-group">
                  <label className="form-label">Offer Title <span className="req">*</span></label>
                  <input type="text" maxLength={120} value={form.title} placeholder="e.g. Diwali Toy Fest"
                    onChange={(e) => set({ title: e.target.value })} />
                  {errors.title && <span className="form-error-msg">{errors.title}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Highlight Badge</label>
                    <input type="text" maxLength={40} value={form.badgeText} placeholder="e.g. UP TO 40% OFF"
                      onChange={(e) => set({ badgeText: e.target.value })} />
                    <span className="form-hint">Small pill on the banner. Leave empty for “Limited Time Offer”.</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Button Text</label>
                    <input type="text" maxLength={30} value={form.ctaText} placeholder="e.g. Shop Now"
                      onChange={(e) => set({ ctaText: e.target.value })} />
                    <span className="form-hint">Leave empty for “Shop the Deal”.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subtitle</label>
                  <input type="text" maxLength={200} value={form.subtitle} placeholder="e.g. On LEGO, puzzles and soft toys"
                    onChange={(e) => set({ subtitle: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea rows={3} maxLength={1000} value={form.description}
                    placeholder="Terms or extra detail — shown on large hero banners"
                    onChange={(e) => set({ description: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label"><FiLink className="icon-inline" /> Where should the banner take shoppers?</label>
                  <input type="text" value={form.targetUrl} placeholder="/shop?category=puzzles  or  https://…"
                    onChange={(e) => set({ targetUrl: e.target.value })} />
                  {errors.targetUrl
                    ? <span className="form-error-msg">{errors.targetUrl}</span>
                    : <span className="form-hint">Empty = the /offers page.</span>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <div className="section-title-badge">FORMAT</div>
                <div className="display-type-grid">
                  {displayTypes.map((t) => (
                    <button type="button" key={t.value}
                      className={`type-card ${form.displayType === t.value ? 'selected' : ''}`}
                      onClick={() => changeDisplayType(t.value)}>
                      <div className="type-card-icon">{t.icon}</div>
                      <div className="type-card-label">{t.label}</div>
                      <div className="type-card-desc">{t.desc}</div>
                      {form.displayType === t.value && <div className="card-check-badge"><FiCheck /></div>}
                    </button>
                  ))}
                </div>

                <div className="section-title-badge" style={{ marginTop: 22 }}>
                  <FiImage className="icon-inline" /> {isSlider ? `SLIDER IMAGES (${totalImages}/${MAX_SLIDER_IMAGES})` : 'BANNER IMAGE'}
                </div>

                {totalImages > 0 && (
                  <div className="image-manager">
                    {form.existingImages.map((img, i) => (
                      <div className="image-manager__item" key={img.url}>
                        <img src={img.url} alt="" />
                        <input type="text" placeholder="Alt text (for SEO & screen readers)" value={img.altText}
                          onChange={(e) => updateExisting(i, { altText: e.target.value })} />
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeExisting(i)} aria-label="Remove image"><FiTrash2 /></button>
                      </div>
                    ))}
                    {form.newImages.map((img, i) => (
                      <div className="image-manager__item image-manager__item--new" key={img.preview}>
                        <img src={img.preview} alt="" />
                        <input type="text" placeholder="Alt text (for SEO & screen readers)" value={img.altText}
                          onChange={(e) => updateNew(i, { altText: e.target.value })} />
                        <span className="image-manager__tag">New</span>
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeNew(i)} aria-label="Remove image"><FiTrash2 /></button>
                      </div>
                    ))}
                  </div>
                )}

                {(isSlider ? totalImages < MAX_SLIDER_IMAGES : true) && (
                  <div
                    className="offer-upload-area"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload size={24} className="upload-icon-pulse" />
                    <div className="upload-title">
                      {!isSlider && totalImages ? 'Replace image' : 'Click or drop images here'}
                    </div>
                    <div className="upload-sub">PNG, JPG or WEBP up to {MAX_FILE_MB}MB · transparent PNG toys look best</div>
                    <input ref={fileInputRef} type="file" hidden multiple={isSlider} accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                  </div>
                )}
                {errors.images && <span className="form-error-msg">{errors.images}</span>}
                {totalImages === 0 && !errors.images && (
                  <span className="form-hint">No image? The banner still works with a gift icon on your colours.</span>
                )}

                <div className="section-title-badge" style={{ marginTop: 22 }}>COLOURS</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Background</label>
                    <div className="color-picker-wrap">
                      <input type="color" value={form.bgColor} onChange={(e) => set({ bgColor: e.target.value })} />
                      <span className="color-picker-hex">{form.bgColor}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Text</label>
                    <div className="color-picker-wrap">
                      <input type="color" value={form.textColor} onChange={(e) => set({ textColor: e.target.value })} />
                      <span className="color-picker-hex">{form.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content">
                <div className="section-title-badge"><FiGrid className="icon-inline" /> WHERE IT APPEARS</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Page <span className="req">*</span></label>
                    <select value={form.page} onChange={(e) => {
                      const page = e.target.value;
                      set({ page, section: sectionPresets[page]?.[0]?.value || 'main' });
                    }}>
                      {pageTargets.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order on the page</label>
                    <select value={form.position} onChange={(e) => set({ position: parseInt(e.target.value, 10) })}>
                      {positionOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="section-options">
                  {sections.map((s) => (
                    <button type="button" key={s.value}
                      className={`section-option ${form.section === s.value ? 'selected' : ''}`}
                      onClick={() => set({ section: s.value })}>
                      <strong>{s.label}</strong>
                      <span>{s.desc}</span>
                    </button>
                  ))}
                </div>
                <span className="form-hint">{OFFERS_PAGE_NOTE}</span>

                <div className="section-title-badge" style={{ marginTop: 22 }}><FiCalendar className="icon-inline" /> SCHEDULE</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Starts <span className="req">*</span></label>
                    <input type="datetime-local" value={form.validFrom} onChange={(e) => set({ validFrom: e.target.value })} />
                    {errors.validFrom && <span className="form-error-msg">{errors.validFrom}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ends <span className="req">*</span></label>
                    <input type="datetime-local" value={form.validTo} min={form.validFrom}
                      onChange={(e) => set({ validTo: e.target.value })} />
                    {errors.validTo && <span className="form-error-msg">{errors.validTo}</span>}
                  </div>
                </div>
                <div className="quick-ranges">
                  <span>Run for:</span>
                  {[3, 7, 15, 30].map((d) => (
                    <button type="button" key={d} className="filter-btn" onClick={() => set({ validTo: daysFrom(form.validFrom, d) })}>
                      {d} days
                    </button>
                  ))}
                </div>
                {scheduleNote && <div className="schedule-note">{scheduleNote}</div>}

                <label className="toggle-switch-row" style={{ marginTop: 16 }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                  <div className="toggle-slider" />
                  <span className="toggle-label">
                    {form.isActive ? 'Active — shows on the storefront during its schedule' : 'Paused — saved as a draft, hidden from shoppers'}
                  </span>
                </label>
              </div>
            )}
          </form>

          <aside className="offer-form-preview">
            <div className="preview-label">LIVE PREVIEW</div>
            <div className="storefront-preview">
              <OfferSlotPreview offers={[draft]} section={form.section} />
            </div>
          </aside>
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button className="btn btn-outline" type="button" onClick={back}><FiArrowLeft /> Back</button>
          )}
          {step < 3 ? (
            <button className="btn btn-primary btn-pills" type="button" onClick={next}>Next <FiArrowRight /></button>
          ) : (
            <button className="btn btn-primary btn-pills" type="submit" form="offerForm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editingOffer ? '✓ Save Changes' : '✓ Publish Offer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferFormModal;
