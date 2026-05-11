import { useState } from 'react';
import { FiX, FiImage, FiPlus, FiLoader, FiShield, FiZap, FiChevronDown, FiChevronUp, FiBox, FiDollarSign, FiFilter, FiCamera, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { generateProductCode } from '../constants/productConstants';

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
const CategoryMultiSelect = ({ selectedIds = [], categoryOptions = [], onChange, label = 'Categories *' }) => {
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((cid) => cid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="admin-field admin-field--full">
      <label>{label}</label>
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
 * FormGroup — collapsible card section for grouping related fields.
 */
const FormGroup = ({ icon, title, defaultOpen = true, children, count }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`form-group ${isOpen ? 'form-group--open' : 'form-group--closed'}`}>
      <button
        type="button"
        className="form-group__header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="form-group__title">
          <span className="form-group__icon">{icon}</span>
          <span>{title}</span>
          {count !== undefined && (
            <span className="form-group__count">{count}</span>
          )}
        </div>
        <span className="form-group__chevron">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>
      {isOpen && (
        <div className="form-group__body">
          <div className="admin-form-grid">
            {children}
          </div>
        </div>
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

          {/* ═══════════ GROUP 1: Product Details ═══════════ */}
          <FormGroup icon={<FiBox />} title="Product Details" defaultOpen={true}>

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

            {/* Product Code — auto-generated, editable */}
            <div className="admin-field">
              <label>Product Code *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="KIDROO-TOY-12345" required {...field('productCode')} style={{ flex: 1 }} />
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setForm(p => ({ ...p, productCode: generateProductCode() }))}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="Generate new Product Code"
                >
                  <FiRefreshCw size={14} /> Generate
                </button>
              </div>
              <p className="admin-field__hint">
                Products with the same Product Code are grouped together as related items.
              </p>
            </div>

            {/* Age Range — multi-select */}
            <div className="admin-field admin-field--full">
              <label>Age Range *</label>
              {/* Selected chips */}
              {form.ageRange.length > 0 && (
                <div className="admin-category-chips">
                  {form.ageRange.map((range) => {
                    const labels = { '0-2': '0–2 years', '2-4': '2–4 years', '4-6': '4–6 years', '6-8': '6–8 years', '8+': '8+ years' };
                    return (
                      <span key={range} className="admin-category-chip">
                        {labels[range] || range}
                        <button type="button" onClick={() => setForm((p) => ({ ...p, ageRange: p.ageRange.filter((r) => r !== range) }))} aria-label={`Remove ${range}`}>
                          <FiX />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Checkbox list */}
              <div className="admin-category-grid">
                {[
                  { value: '0-2', label: '0–2 years' },
                  { value: '2-4', label: '2–4 years' },
                  { value: '4-6', label: '4–6 years' },
                  { value: '6-8', label: '6–8 years' },
                  { value: '8+',  label: '8+ years'  },
                ].map((opt) => {
                  const checked = form.ageRange.includes(opt.value);
                  return (
                    <label key={opt.value} className={`admin-category-option ${checked ? 'admin-category-option--checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm((p) => ({
                            ...p,
                            ageRange: checked
                              ? p.ageRange.filter((r) => r !== opt.value)
                              : [...p.ageRange, opt.value],
                          }));
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

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

            {/* Tags */}
            <div className="admin-field admin-field--full">
              <label>Tags * (comma separated)</label>
              <input type="text" placeholder="wooden,car,toy" required {...field('tags')} />
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

          </FormGroup>

          {/* ═══════════ GROUP 2: Pricing & Inventory ═══════════ */}
          <FormGroup icon={<FiDollarSign />} title="Pricing & Inventory" defaultOpen={true}>

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

          </FormGroup>

          {/* ═══════════ GROUP 3: Categorization & Filters ═══════════ */}
          <FormGroup
            icon={<FiFilter />}
            title="Categorization & Filters"
            defaultOpen={true}
            count={form.categories.length + (form.skills?.length || 0)}
          >

            {/* Categories ─ Multi-select (full width) */}
            <CategoryMultiSelect
              selectedIds={form.categories}
              categoryOptions={categoryOptions}
              onChange={(ids) => setForm((p) => ({ ...p, categories: ids }))}
            />

            {/* Skills */}
            <CategoryMultiSelect
              label="Skills"
              selectedIds={form.skills}
              categoryOptions={(skillOptions || []).map((s) => ({
                ...s,
                catagoryName: s.name,
              }))}
              onChange={(ids) => setForm((p) => ({ ...p, skills: ids }))}
            />

            {/* Boolean selects */}
            {BOOL_FIELDS.map(({ key, label }) => (
              <SelectField key={key} label={label} {...boolSelect(key)} />
            ))}

          </FormGroup>

          {/* ═══════════ GROUP 4: Media & Images ═══════════ */}
          <FormGroup
            icon={<FiCamera />}
            title="Media & Images"
            defaultOpen={false}
            count={form.previewUrls.length}
          >

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

          </FormGroup>

          {/* ═══════════ GROUP 5: SEO ═══════════ */}
          <FormGroup icon={<FiSearch />} title="SEO (Search Engine Optimization)" defaultOpen={false}>

            {/* SEO Title */}
            <div className="admin-field admin-field--full">
              <label>SEO Title</label>
              <input
                type="text"
                placeholder="e.g. Buy Wooden Toy Car for Kids | Kidroo Toys"
                maxLength={70}
                {...field('seoTitle')}
              />
              <p className="admin-field__hint">
                Custom title for search engine results. Keep it under 60 characters for best display.
                {form.seoTitle && (
                  <span style={{ marginLeft: 8, color: form.seoTitle.length > 60 ? '#e74c3c' : '#27ae60' }}>
                    ({form.seoTitle.length}/60)
                  </span>
                )}
              </p>
            </div>

            {/* SEO Description */}
            <div className="admin-field admin-field--full">
              <label>SEO Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Shop premium quality wooden toy car for kids aged 2-6. Safe, eco-friendly, and educational. Free shipping over ₹500."
                maxLength={170}
                value={form.seoDescription}
                onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))}
              />
              <p className="admin-field__hint">
                Custom description for search engine results. Keep it under 155 characters for best display.
                {form.seoDescription && (
                  <span style={{ marginLeft: 8, color: form.seoDescription.length > 155 ? '#e74c3c' : '#27ae60' }}>
                    ({form.seoDescription.length}/155)
                  </span>
                )}
              </p>
            </div>

            {/* SEO Keywords */}
            <div className="admin-field admin-field--full">
              <label>SEO Keywords (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. wooden toys, kids toys, educational, montessori"
                {...field('seoKeywords')}
              />
              <p className="admin-field__hint">
                These keywords help your product appear in search engine results. Add relevant words customers might search for.
              </p>
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 6: Warranty & Guarantee ═══════════ */}
          <FormGroup icon={<FiShield />} title="Warranty & Guarantee" defaultOpen={false}>

            {/* Warranty — checkbox + inline fields */}
            <div className="admin-field admin-field--full">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={!!form.hasWarranty}
                  onChange={(e) => setForm((p) => ({ ...p, hasWarranty: e.target.checked }))}
                />
                Has Warranty
              </label>
              {form.hasWarranty && (
                <div className="admin-inline-fields">
                  <div className="admin-inline-field">
                    <label>Period (months)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="12"
                      {...field('warrantyPeriod')}
                    />
                  </div>
                  <div className="admin-inline-field">
                    <label>Type</label>
                    <select value={form.warrantyType} onChange={(e) => setForm((p) => ({ ...p, warrantyType: e.target.value }))}>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Guarantee — checkbox + inline fields */}
            <div className="admin-field admin-field--full">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={!!form.hasGuarantee}
                  onChange={(e) => setForm((p) => ({ ...p, hasGuarantee: e.target.checked }))}
                />
                Has Guarantee
              </label>
              {form.hasGuarantee && (
                <div className="admin-inline-fields">
                  <div className="admin-inline-field">
                    <label>Period (months)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="6"
                      {...field('guaranteePeriod')}
                    />
                  </div>
                  <div className="admin-inline-field admin-inline-field--grow">
                    <label>Terms</label>
                    <input
                      type="text"
                      placeholder="e.g. 100% money-back if not satisfied…"
                      value={form.guaranteeTerms}
                      onChange={(e) => setForm((p) => ({ ...p, guaranteeTerms: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

          </FormGroup>

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
