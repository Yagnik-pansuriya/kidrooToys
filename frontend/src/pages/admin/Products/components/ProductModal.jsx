import { FiX, FiImage, FiPlus, FiLoader, FiShield, FiAward, FiZap } from 'react-icons/fi';

/**
 * SelectField — thin wrapper to keep inline JSX tidy.
 */
const SelectField = ({ label, value, onChange, options }) => (
  <div className="admin-field">
    <label>{label}</label>
    <select value={String(value)} onChange={onChange}>
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  </div>
);

/**
 * CategoryMultiSelect
 * Renders a checkbox list of categories with chip-style selections.
 */
const CategoryMultiSelect = ({ selectedIds = [], categoryOptions = [], onChange }) => {
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((cid) => cid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="admin-field admin-field--full">
      <label>Categories *</label>
      {/* Selected chips */}
      {selectedIds.length > 0 && (
        <div className="admin-category-chips">
          {selectedIds.map((id) => {
            const cat = categoryOptions.find((c) => (c._id || c.id) === id);
            const name = cat?.catagoryName || cat?.name || id;
            return (
              <span key={id} className="admin-category-chip">
                {name}
                <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${name}`}>
                  <FiX />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {/* Checkbox list */}
      <div className="admin-category-grid">
        {categoryOptions.map((c) => {
          const id = c._id || c.id;
          const name = c.catagoryName || c.name;
          const checked = selectedIds.includes(id);
          return (
            <label key={id} className={`admin-category-option ${checked ? 'admin-category-option--checked' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(id)}
              />
              <span>{name}</span>
            </label>
          );
        })}
      </div>
      {categoryOptions.length === 0 && (
        <p className="admin-field__hint">No categories available. Create one first.</p>
      )}
    </div>
  );
};

/**
 * ProductModal
 *
 * Props:
 *  editing          {object|null}   null = add mode, product object = edit mode
 *  form             {object}        Controlled form state
 *  apiError         {string}        Error message from API
 *  isBusy           {boolean}       true while add / update mutation is in-flight
 *  categoryOptions  {Array}         List of { _id, catagoryName } objects
 *  fileInputRef     {ref}           Ref to hidden <input type="file" />
 *  setForm          {fn}            State setter from useProductForm
 *  onSubmit         {fn}            Form submit handler
 *  onClose          {fn}            Close / cancel handler
 *  onAddImages      {fn}            File input change handler
 *  onRemoveImage    {fn}            Remove image at index
 */
const ProductModal = ({
  editing,
  form,
  apiError,
  isBusy,
  categoryOptions,
  skillOptions,
  fileInputRef,
  setForm,
  onSubmit,
  onClose,
  onAddImages,
  onRemoveImage,
}) => {
  // ── Helpers ──────────────────────────────────────────────────
  const field = (key) => ({
    value:    form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const boolSelect = (key) => ({
    value:   form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value === 'true' })),
    options:  [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
  });

  const BOOL_FIELDS = [
    { key: 'featured',   label: 'Featured'    },
    { key: 'newArrival', label: 'New Arrival'  },
    { key: 'bestSeller', label: 'Best Seller'  },
    { key: 'isActive',   label: 'Is Active'    },
  ];

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="admin-modal__header">
          <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>

        {/* ── Form ── */}
        <form className="admin-modal__form" onSubmit={onSubmit} noValidate>

          {/* API error banner */}
          {apiError && (
            <div className="admin-login__error" style={{ marginBottom: '1rem' }}>
              {apiError}
            </div>
          )}

          <div className="admin-form-grid">

            {/* Product Name ─ full width */}
            <div className="admin-field admin-field--full">
              <label>Product Name *</label>
              <input type="text" placeholder="e.g. Wooden Toy Car" required {...field('productName')} />
            </div>

            {/* Slug */}
            <div className="admin-field">
              <label>Slug *</label>
              <input type="text" placeholder="e.g. wooden-toy-car" required {...field('slug')} />
            </div>

            {/* Price */}
            <div className="admin-field">
              <label>Price *</label>
              <input type="number" step="0.01" min="0" placeholder="29.99" required {...field('price')} />
            </div>

            {/* Original Price */}
            <div className="admin-field">
              <label>Original Price *</label>
              <input type="number" step="0.01" min="0" placeholder="39.99" required {...field('originalPrice')} />
            </div>

            {/* Discount % */}
            <div className="admin-field">
              <label>Discount % *</label>
              <input type="number" min="0" placeholder="25" required {...field('discountPercentage')} />
            </div>

            {/* Stock */}
            <div className="admin-field">
              <label>Stock *</label>
              <input type="number" min="0" placeholder="100" required {...field('stock')} />
            </div>

            {/* Ratings */}
            <div className="admin-field">
              <label>Ratings *</label>
              <input type="number" step="0.1" min="0" max="5" placeholder="4.5" required {...field('ratings')} />
            </div>

            {/* Num Reviews */}
            <div className="admin-field">
              <label>Num Reviews *</label>
              <input type="number" min="0" placeholder="120" required {...field('numReviews')} />
            </div>

            {/* Categories ─ Multi-select (full width) */}
            <CategoryMultiSelect
              selectedIds={form.categories}
              categoryOptions={categoryOptions}
              onChange={(ids) => setForm((p) => ({ ...p, categories: ids }))}
            />

            {/* Tags */}
            <div className="admin-field">
              <label>Tags * (comma separated)</label>
              <input type="text" placeholder="wooden,car,toy" required {...field('tags')} />
            </div>

            {/* Age Range */}
            <div className="admin-field">
              <label>Age From *</label>
              <input type="number" min="0" placeholder="3" required {...field('ageRangeFrom')} />
            </div>

            <div className="admin-field">
              <label>Age To *</label>
              <input type="number" min="0" placeholder="8" required {...field('ageRangeTo')} />
            </div>

            {/* Boolean selects */}
            {BOOL_FIELDS.map(({ key, label }) => (
              <SelectField key={key} label={label} {...boolSelect(key)} />
            ))}

            {/* Description ─ full width */}
            <div className="admin-field admin-field--full">
              <label>Description *</label>
              <textarea
                rows={3}
                placeholder="High-quality wooden toy car…"
                required
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* YouTube Video URL ─ full width */}
            <div className="admin-field admin-field--full">
              <label>YouTube Video URL (optional)</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...field('youtubeUrl')}
              />
            </div>

            {/* ═══════════ SKILLS SECTION ═══════════ */}
            <div className="admin-field admin-field--full admin-section-divider">
              <h3 className="admin-section-title">
                <FiZap /> Skills
              </h3>
            </div>

            <CategoryMultiSelect
              selectedIds={form.skills}
              categoryOptions={(skillOptions || []).map((s) => ({
                ...s,
                catagoryName: s.name,
              }))}
              onChange={(ids) => setForm((p) => ({ ...p, skills: ids }))}
            />

            {/* ═══════════ WARRANTY / GUARANTEE SECTION ═══════════ */}
            <div className="admin-field admin-field--full admin-section-divider">
              <h3 className="admin-section-title">
                <FiShield /> Warranty & Guarantee
              </h3>
            </div>

            {/* Has Warranty toggle */}
            <SelectField label="Has Warranty" {...boolSelect('hasWarranty')} />

            {/* Warranty details — shown only when hasWarranty is true */}
            {form.hasWarranty && (
              <>
                <div className="admin-field">
                  <label>Warranty Period (months)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="12"
                    {...field('warrantyPeriod')}
                  />
                </div>
                <div className="admin-field">
                  <label>Warranty Type</label>
                  <select value={form.warrantyType} onChange={(e) => setForm((p) => ({ ...p, warrantyType: e.target.value }))}>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </>
            )}

            {/* Has Guarantee toggle */}
            <SelectField label="Has Guarantee" {...boolSelect('hasGuarantee')} />

            {/* Guarantee details — shown only when hasGuarantee is true */}
            {form.hasGuarantee && (
              <>
                <div className="admin-field">
                  <label>Guarantee Period (months)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="6"
                    {...field('guaranteePeriod')}
                  />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Guarantee Terms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 100% money-back guarantee if not satisfied…"
                    value={form.guaranteeTerms}
                    onChange={(e) => setForm((p) => ({ ...p, guaranteeTerms: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Images ─ full width */}
            <div className="admin-field admin-field--full">
              <label><FiImage aria-hidden="true" /> Product Images (up to 5)</label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={onAddImages}
              />

              <div className="admin-image-grid">
                {/* Existing / new previews */}
                {form.previewUrls.map((url, i) => (
                  <div key={i} className="admin-image-slot admin-image-slot--filled">
                    <img src={url} alt={`Preview ${i + 1}`} />
                    <button
                      type="button"
                      className="admin-image-slot__remove"
                      onClick={() => onRemoveImage(i)}
                      aria-label={`Remove image ${i + 1}`}
                    >
                      <FiX />
                    </button>
                    <span className="admin-image-slot__num">{i + 1}</span>
                  </div>
                ))}

                {/* Add-more slot */}
                {form.previewUrls.length < 5 && (
                  <button
                    type="button"
                    className="admin-image-slot admin-image-slot--add"
                    onClick={() => fileInputRef.current?.click()}
                    title="Add image"
                  >
                    <FiPlus />
                    <span>Add Image</span>
                    <small>{form.previewUrls.length}/5</small>
                  </button>
                )}
              </div>
            </div>

          </div>{/* /admin-form-grid */}

          {/* ── Actions ── */}
          <div className="admin-modal__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isBusy}>
              {isBusy
                ? <><FiLoader className="spin" aria-hidden="true" /> Saving…</>
                : <>{editing ? 'Update' : 'Add'} Product</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductModal;
