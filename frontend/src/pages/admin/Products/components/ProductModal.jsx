import { useState, useEffect } from 'react';
import { FiX, FiImage, FiPlus, FiLoader, FiShield, FiChevronDown, FiChevronUp, FiBox, FiDollarSign, FiFilter, FiCamera, FiSearch, FiRefreshCw, FiList, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { generateProductCode, generateSkuCode, MAX_IMAGES } from '../constants/productConstants';
import { slugify } from '../../../../utils/slugify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// ── Quill toolbar config ─────────────────────────────────────────
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};
const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'color', 'background', 'align', 'link',
];

/**
 * SelectField — thin wrapper to keep inline JSX tidy.
 */
const SelectField = ({ label, value, onChange, options, error }) => (
  <div className={`admin-field ${error ? 'admin-field--error' : ''}`}>
    <label>{label}</label>
    <select className={error ? 'has-error' : ''} value={String(value)} onChange={onChange}>
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
    {error && (
      <p className="admin-field__error">
        <FiAlertCircle /> {error}
      </p>
    )}
  </div>
);

/**
 * CategoryMultiSelect
 * Renders a checkbox list of categories with chip-style selections and error support.
 */
const CategoryMultiSelect = ({ selectedIds = [], categoryOptions = [], onChange, label = 'Categories *', error }) => {
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((cid) => cid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`admin-field admin-field--full ${error ? 'admin-field--error' : ''}`}>
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
      <div className={`admin-category-grid ${error ? 'has-error' : ''}`}>
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
      {error && (
        <p className="admin-field__error">
          <FiAlertCircle /> {error}
        </p>
      )}
    </div>
  );
};

/**
 * FormGroup — collapsible card section for grouping related fields.
 * Automatically expands if any contained field has an error.
 */
const FormGroup = ({ icon, title, defaultOpen = true, children, count, errorKeys = [], errors = {} }) => {
  const hasGroupError = errorKeys.some((k) => Boolean(errors[k]));
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (hasGroupError) {
      setIsOpen(true);
    }
  }, [hasGroupError]);

  return (
    <div className={`form-group ${isOpen ? 'form-group--open' : 'form-group--closed'} ${hasGroupError ? 'form-group--has-error' : ''}`}>
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
          {hasGroupError && (
            <span className="form-group__error-badge">
              <FiAlertCircle /> Attention required
            </span>
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
  errors = {},
  apiError,
  isBusy,
  categoryOptions,
  skillOptions,
  fileInputRef,
  setForm,
  clearError,
  onSubmit,
  onClose,
  onAddImages,
  onRemoveImage,
}) => {
  // ── Helpers ──────────────────────────────────────────────────
  const field = (key) => ({
    value:    form[key],
    onChange: (e) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      if (clearError) clearError(key);
    },
  });

  const BOOL_FIELDS = [
    { key: 'featured',   label: 'Featured'    },
    { key: 'newArrival', label: 'New Arrival'  },
    { key: 'bestSeller', label: 'Best Seller'  },
    { key: 'isActive',   label: 'Is Active'    },
  ];

  // ── Pricing Auto-calculation Handlers ────────────────────────
  const handlePriceChange = (e) => {
    const val = e.target.value;
    setForm((p) => {
      const next = { ...p, price: val };
      const pVal = parseFloat(val);
      const opVal = parseFloat(p.originalPrice);

      if (!isNaN(pVal) && pVal >= 0 && !isNaN(opVal) && opVal > 0) {
        let discount = Math.round(((opVal - pVal) / opVal) * 100);
        next.discountPercentage = discount < 0 ? 0 : discount;
      }
      return next;
    });
    if (clearError) clearError('price');
  };

  const handleOriginalPriceChange = (e) => {
    const val = e.target.value;
    setForm((p) => {
      const next = { ...p, originalPrice: val };
      const opVal = parseFloat(val);
      const pVal = parseFloat(p.price);

      if (!isNaN(opVal) && opVal > 0 && !isNaN(pVal) && pVal >= 0) {
        let discount = Math.round(((opVal - pVal) / opVal) * 100);
        next.discountPercentage = discount < 0 ? 0 : discount;
      }
      return next;
    });
    if (clearError) clearError('originalPrice');
  };

  const handleDiscountChange = (e) => {
    setForm((p) => ({ ...p, discountPercentage: e.target.value }));
    if (clearError) clearError('discountPercentage');
  };

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
          <FormGroup
            icon={<FiBox />}
            title="Product Details"
            defaultOpen={true}
            errorKeys={['productName', 'slug', 'productCode', 'skuCode', 'ageRange', 'description', 'tags', 'youtubeUrl', 'youtubeUrl2']}
            errors={errors}
          >

            {/* Product Name ─ full width */}
            <div className={`admin-field admin-field--full ${errors.productName ? 'admin-field--error' : ''}`}>
              <label>Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Wooden Toy Car"
                required
                className={errors.productName ? 'has-error' : ''}
                value={form.productName}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((p) => ({
                    ...p,
                    productName: name,
                    slug: slugify(name),
                  }));
                  if (clearError) {
                    clearError('productName');
                    clearError('slug');
                  }
                }}
              />
              {errors.productName && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.productName}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className={`admin-field ${errors.slug ? 'admin-field--error' : ''}`}>
              <label>Slug *</label>
              <input
                type="text"
                placeholder="e.g. wooden-toy-car"
                required
                className={errors.slug ? 'has-error' : ''}
                value={form.slug}
                onChange={(e) => {
                  setForm((p) => ({ ...p, slug: slugify(e.target.value) }));
                  if (clearError) clearError('slug');
                }}
              />
              <p className="admin-field__hint" style={{ marginTop: '0.25rem' }}>
                Auto-generated from name. URL: /product/{form.slug || 'your-slug'}
              </p>
              {errors.slug && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.slug}
                </p>
              )}
            </div>

            {/* Product Code — auto-generated, editable */}
            <div className={`admin-field ${errors.productCode ? 'admin-field--error' : ''}`}>
              <label>Product Code *</label>
              <div className="admin-field__group">
                <input
                  type="text"
                  placeholder="KIDROO-TOY-12345"
                  required
                  className={errors.productCode ? 'has-error' : ''}
                  {...field('productCode')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm(p => ({ ...p, productCode: generateProductCode() }));
                    if (clearError) clearError('productCode');
                  }}
                  title="Generate new Product Code"
                >
                  <FiRefreshCw /> Generate
                </button>
              </div>
              <p className="admin-field__hint">
                Products with the same Product Code are grouped together as related items.
              </p>
              {errors.productCode && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.productCode}
                </p>
              )}
            </div>

            {/* SKU Code */}
            <div className={`admin-field ${errors.skuCode ? 'admin-field--error' : ''}`}>
              <label>SKU Code</label>
              <div className="admin-field__group">
                <input
                  type="text"
                  placeholder="e.g. SKU-WTC-001"
                  className={errors.skuCode ? 'has-error' : ''}
                  {...field('skuCode')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm(p => ({ ...p, skuCode: generateSkuCode() }));
                    if (clearError) clearError('skuCode');
                  }}
                  title="Generate new SKU Code"
                >
                  <FiRefreshCw /> Generate
                </button>
              </div>
              <p className="admin-field__hint">
                Unique Stock Keeping Unit code for inventory tracking.
              </p>
              {errors.skuCode && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.skuCode}
                </p>
              )}
            </div>

            {/* Age Range — multi-select */}
            <div className={`admin-field admin-field--full ${errors.ageRange ? 'admin-field--error' : ''}`}>
              <label>Age Range *</label>
              {/* Selected chips */}
              {form.ageRange.length > 0 && (
                <div className="admin-category-chips">
                  {form.ageRange.map((range) => {
                    const labels = { '0-2': '0–2 years', '2-4': '2–4 years', '4-6': '4–6 years', '6-8': '6–8 years', '8+': '8+ years' };
                    return (
                      <span key={range} className="admin-category-chip">
                        {labels[range] || range}
                        <button
                          type="button"
                          onClick={() => {
                            setForm((p) => ({ ...p, ageRange: p.ageRange.filter((r) => r !== range) }));
                            if (clearError) clearError('ageRange');
                          }}
                          aria-label={`Remove ${range}`}
                        >
                          <FiX />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Checkbox list */}
              <div className={`admin-category-grid ${errors.ageRange ? 'has-error' : ''}`}>
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
                          if (clearError) clearError('ageRange');
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.ageRange && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.ageRange}
                </p>
              )}
            </div>

            {/* Description ─ full width (Rich Text Editor) */}
            <div className={`admin-field admin-field--full ${errors.description ? 'admin-field--error' : ''}`}>
              <label>Description *</label>
              <div className={`admin-quill-wrap ${errors.description ? 'has-error' : ''}`}>
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={(val) => {
                    setForm((p) => ({ ...p, description: val }));
                    if (clearError) clearError('description');
                  }}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Write a rich product description…"
                />
              </div>
              {errors.description && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.description}
                </p>
              )}
            </div>

            {/* Bullet Points */}
            <div className={`admin-field admin-field--full ${errors.tags ? 'admin-field--error' : ''}`}>
              <label>Bullet Points *</label>
              <p className="admin-field__hint" style={{ marginBottom: '0.5rem' }}>
                Add key product highlights. Each bullet point appears on the product page.
              </p>
              <div className={`admin-bullet-list ${errors.tags ? 'has-error' : ''}`}>
                {(form.tags || []).map((tag, idx) => (
                  <div key={idx} className="admin-bullet-row">
                    <span className="admin-bullet-row__num">{idx + 1}</span>
                    <input
                      type="text"
                      placeholder={`Bullet point ${idx + 1}`}
                      value={tag}
                      className={`admin-bullet-row__input ${errors.tags ? 'has-error' : ''}`}
                      onChange={(e) => {
                        const updated = [...form.tags];
                        updated[idx] = e.target.value;
                        setForm((p) => ({ ...p, tags: updated }));
                        if (clearError) clearError('tags');
                      }}
                    />
                    <button
                      type="button"
                      className="admin-bullet-row__remove"
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          tags: p.tags.filter((_, i) => i !== idx),
                        }));
                      }}
                      title="Remove this bullet point"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-bullet-add-btn"
                  onClick={() =>
                    setForm((p) => ({ ...p, tags: [...(p.tags || []), ''] }))
                  }
                >
                  <FiPlus /> Add Bullet Point
                </button>
              </div>
              {errors.tags && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.tags}
                </p>
              )}
            </div>

            {/* YouTube Video URL 1 ─ full width */}
            <div className={`admin-field admin-field--full ${errors.youtubeUrl ? 'admin-field--error' : ''}`}>
              <label>YouTube Video URL 1 (optional)</label>
              <input
                type="url"
                className={errors.youtubeUrl ? 'has-error' : ''}
                placeholder="https://www.youtube.com/watch?v=..."
                {...field('youtubeUrl')}
              />
              {errors.youtubeUrl && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.youtubeUrl}
                </p>
              )}
            </div>

            {/* YouTube Video URL 2 ─ full width */}
            <div className={`admin-field admin-field--full ${errors.youtubeUrl2 ? 'admin-field--error' : ''}`}>
              <label>YouTube Video URL 2 (optional)</label>
              <input
                type="url"
                className={errors.youtubeUrl2 ? 'has-error' : ''}
                placeholder="https://www.youtube.com/watch?v=..."
                {...field('youtubeUrl2')}
              />
              {errors.youtubeUrl2 && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.youtubeUrl2}
                </p>
              )}
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 2: Pricing & Inventory ═══════════ */}
          <FormGroup
            icon={<FiDollarSign />}
            title="Pricing & Inventory"
            defaultOpen={true}
            errorKeys={['price', 'originalPrice', 'discountPercentage', 'stock', 'ratings', 'numReviews']}
            errors={errors}
          >

            {/* Price */}
            <div className={`admin-field ${errors.price ? 'admin-field--error' : ''}`}>
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={errors.price ? 'has-error' : ''}
                placeholder="29.99"
                required
                value={form.price}
                onChange={handlePriceChange}
              />
              {errors.price && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.price}
                </p>
              )}
            </div>

            {/* Original Price */}
            <div className={`admin-field ${errors.originalPrice ? 'admin-field--error' : ''}`}>
              <label>Original Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={errors.originalPrice ? 'has-error' : ''}
                placeholder="39.99"
                required
                value={form.originalPrice}
                onChange={handleOriginalPriceChange}
              />
              {errors.originalPrice && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.originalPrice}
                </p>
              )}
            </div>

            {/* Discount % */}
            <div className={`admin-field ${errors.discountPercentage ? 'admin-field--error' : ''}`}>
              <label>Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                className={errors.discountPercentage ? 'has-error' : ''}
                placeholder="25"
                value={form.discountPercentage}
                onChange={handleDiscountChange}
              />
              {errors.discountPercentage && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.discountPercentage}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className={`admin-field ${errors.stock ? 'admin-field--error' : ''}`}>
              <label>Stock *</label>
              <input
                type="number"
                min="0"
                className={errors.stock ? 'has-error' : ''}
                placeholder="100"
                required
                {...field('stock')}
              />
              {errors.stock && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.stock}
                </p>
              )}
            </div>

            {/* Ratings */}
            <div className={`admin-field ${errors.ratings ? 'admin-field--error' : ''}`}>
              <label>Ratings</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className={errors.ratings ? 'has-error' : ''}
                placeholder="4.5"
                {...field('ratings')}
              />
              {errors.ratings && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.ratings}
                </p>
              )}
            </div>

            {/* Num Reviews */}
            <div className={`admin-field ${errors.numReviews ? 'admin-field--error' : ''}`}>
              <label>Num Reviews</label>
              <input
                type="number"
                min="0"
                className={errors.numReviews ? 'has-error' : ''}
                placeholder="120"
                {...field('numReviews')}
              />
              {errors.numReviews && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.numReviews}
                </p>
              )}
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 3: Categorization & Filters ═══════════ */}
          <FormGroup
            icon={<FiFilter />}
            title="Categorization & Filters"
            defaultOpen={true}
            count={form.categories.length + (form.skills?.length || 0)}
            errorKeys={['categories', 'skills']}
            errors={errors}
          >

            {/* Categories ─ Multi-select (full width) */}
            <CategoryMultiSelect
              selectedIds={form.categories}
              categoryOptions={categoryOptions}
              error={errors.categories}
              onChange={(ids) => {
                setForm((p) => ({ ...p, categories: ids }));
                if (clearError) clearError('categories');
              }}
            />

            {/* Skills */}
            <CategoryMultiSelect
              label="Skills"
              selectedIds={form.skills}
              error={errors.skills}
              categoryOptions={(skillOptions || []).map((s) => ({
                ...s,
                catagoryName: s.name,
              }))}
              onChange={(ids) => {
                setForm((p) => ({ ...p, skills: ids }));
                if (clearError) clearError('skills');
              }}
            />

            {/* Boolean checkboxes */}
            {BOOL_FIELDS.map(({ key, label }) => (
              <div key={key} className="admin-field" style={{ justifyContent: 'center' }}>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              </div>
            ))}

          </FormGroup>

          {/* ═══════════ GROUP 4: Media & Images ═══════════ */}
          <FormGroup
            icon={<FiCamera />}
            title="Media & Images"
            defaultOpen={false}
            count={form.previewUrls.length}
            errorKeys={['images']}
            errors={errors}
          >

            {/* Images ─ full width */}
            <div className={`admin-field admin-field--full ${errors.images ? 'admin-field--error' : ''}`}>
              <label><FiImage aria-hidden="true" /> Product Images (up to {MAX_IMAGES}) *</label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={onAddImages}
              />

              <div className={`admin-image-grid ${errors.images ? 'has-error' : ''}`}>
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
                {form.previewUrls.length < MAX_IMAGES && (
                  <button
                    type="button"
                    className="admin-image-slot admin-image-slot--add"
                    onClick={() => fileInputRef.current?.click()}
                    title="Add image"
                  >
                    <FiPlus />
                    <span>Add Image</span>
                    <small>{form.previewUrls.length}/{MAX_IMAGES}</small>
                  </button>
                )}
              </div>
              {errors.images && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.images}
                </p>
              )}
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 5: SEO ═══════════ */}
          <FormGroup
            icon={<FiSearch />}
            title="SEO (Search Engine Optimization)"
            defaultOpen={false}
            errorKeys={['seoTitle', 'seoDescription', 'seoKeywords']}
            errors={errors}
          >

            {/* SEO Title */}
            <div className={`admin-field admin-field--full ${errors.seoTitle ? 'admin-field--error' : ''}`}>
              <label>SEO Title</label>
              <input
                type="text"
                placeholder="e.g. Buy Wooden Toy Car for Kids | Kidroo Toys"
                maxLength={70}
                className={errors.seoTitle ? 'has-error' : ''}
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
              {errors.seoTitle && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.seoTitle}
                </p>
              )}
            </div>

            {/* SEO Description */}
            <div className={`admin-field admin-field--full ${errors.seoDescription ? 'admin-field--error' : ''}`}>
              <label>SEO Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Shop premium quality wooden toy car for kids aged 2-6. Safe, eco-friendly, and educational. Free shipping over ₹500."
                maxLength={170}
                className={errors.seoDescription ? 'has-error' : ''}
                value={form.seoDescription}
                onChange={(e) => {
                  setForm((p) => ({ ...p, seoDescription: e.target.value }));
                  if (clearError) clearError('seoDescription');
                }}
              />
              <p className="admin-field__hint">
                Custom description for search engine results. Keep it under 155 characters for best display.
                {form.seoDescription && (
                  <span style={{ marginLeft: 8, color: form.seoDescription.length > 155 ? '#e74c3c' : '#27ae60' }}>
                    ({form.seoDescription.length}/155)
                  </span>
                )}
              </p>
              {errors.seoDescription && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.seoDescription}
                </p>
              )}
            </div>

            {/* SEO Keywords */}
            <div className={`admin-field admin-field--full ${errors.seoKeywords ? 'admin-field--error' : ''}`}>
              <label>SEO Keywords (comma separated)</label>
              <input
                type="text"
                className={errors.seoKeywords ? 'has-error' : ''}
                placeholder="e.g. wooden toys, kids toys, educational, montessori"
                {...field('seoKeywords')}
              />
              <p className="admin-field__hint">
                These keywords help your product appear in search engine results. Add relevant words customers might search for.
              </p>
              {errors.seoKeywords && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.seoKeywords}
                </p>
              )}
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 6: Warranty & Guarantee ═══════════ */}
          <FormGroup
            icon={<FiShield />}
            title="Warranty & Guarantee"
            defaultOpen={false}
            errorKeys={['warrantyPeriod', 'warrantyType', 'guaranteePeriod', 'guaranteeTerms']}
            errors={errors}
          >

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
                  <div className={`admin-inline-field ${errors.warrantyPeriod ? 'admin-field--error' : ''}`}>
                    <label>Period (months) *</label>
                    <input
                      type="number"
                      min="0"
                      className={errors.warrantyPeriod ? 'has-error' : ''}
                      placeholder="12"
                      {...field('warrantyPeriod')}
                    />
                    {errors.warrantyPeriod && (
                      <p className="admin-field__error">
                        <FiAlertCircle /> {errors.warrantyPeriod}
                      </p>
                    )}
                  </div>
                  <div className={`admin-inline-field ${errors.warrantyType ? 'admin-field--error' : ''}`}>
                    <label>Type *</label>
                    <select
                      className={errors.warrantyType ? 'has-error' : ''}
                      value={form.warrantyType}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, warrantyType: e.target.value }));
                        if (clearError) clearError('warrantyType');
                      }}
                    >
                      <option value="manufacturer">Manufacturer</option>
                      <option value="seller">Seller</option>
                    </select>
                    {errors.warrantyType && (
                      <p className="admin-field__error">
                        <FiAlertCircle /> {errors.warrantyType}
                      </p>
                    )}
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
                  <div className={`admin-inline-field ${errors.guaranteePeriod ? 'admin-field--error' : ''}`}>
                    <label>Period (months) *</label>
                    <input
                      type="number"
                      min="0"
                      className={errors.guaranteePeriod ? 'has-error' : ''}
                      placeholder="6"
                      {...field('guaranteePeriod')}
                    />
                    {errors.guaranteePeriod && (
                      <p className="admin-field__error">
                        <FiAlertCircle /> {errors.guaranteePeriod}
                      </p>
                    )}
                  </div>
                  <div className={`admin-inline-field admin-inline-field--grow ${errors.guaranteeTerms ? 'admin-field--error' : ''}`}>
                    <label>Terms *</label>
                    <input
                      type="text"
                      className={errors.guaranteeTerms ? 'has-error' : ''}
                      placeholder="e.g. 100% money-back if not satisfied…"
                      value={form.guaranteeTerms}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, guaranteeTerms: e.target.value }));
                        if (clearError) clearError('guaranteeTerms');
                      }}
                    />
                    {errors.guaranteeTerms && (
                      <p className="admin-field__error">
                        <FiAlertCircle /> {errors.guaranteeTerms}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </FormGroup>

          {/* ═══════════ GROUP 7: Product Specifications ═══════════ */}
          <FormGroup
            icon={<FiList />}
            title="Product Specifications"
            defaultOpen={false}
            count={form.specifications?.length || 0}
            errorKeys={['specifications']}
            errors={errors}
          >
            <div className={`admin-field admin-field--full ${errors.specifications ? 'admin-field--error' : ''}`}>
              <p className="admin-field__hint" style={{ marginBottom: '0.75rem' }}>
                Build a specifications table for this product. Add rows like Color, Size, Material, Weight, Dimensions etc.
              </p>

              {/* Specifications Table */}
              <div className="admin-spec-table-wrap">
                <table className="admin-spec-table">
                  <thead>
                    <tr>
                      <th className="admin-spec-table__num">#</th>
                      <th className="admin-spec-table__key-col">Specification</th>
                      <th className="admin-spec-table__val-col">Value / Details</th>
                      <th className="admin-spec-table__action-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.specifications || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="admin-spec-table__empty">
                          No specifications added yet. Click "Add Row" below to start building the table.
                        </td>
                      </tr>
                    ) : (
                      (form.specifications || []).map((spec, idx) => (
                        <tr key={idx} className="admin-spec-table__row">
                          <td className="admin-spec-table__num-cell">{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              placeholder="e.g. Color, Size, Material…"
                              value={spec.key}
                              className={`admin-spec-table__input ${errors.specifications ? 'has-error' : ''}`}
                              onChange={(e) => {
                                const updated = [...form.specifications];
                                updated[idx] = { ...updated[idx], key: e.target.value };
                                setForm((p) => ({ ...p, specifications: updated }));
                                if (clearError) clearError('specifications');
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="e.g. Red, Large, Wood…"
                              value={spec.value}
                              className={`admin-spec-table__input ${errors.specifications ? 'has-error' : ''}`}
                              onChange={(e) => {
                                const updated = [...form.specifications];
                                updated[idx] = { ...updated[idx], value: e.target.value };
                                setForm((p) => ({ ...p, specifications: updated }));
                                if (clearError) clearError('specifications');
                              }}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-spec-table__remove-btn"
                              onClick={() => {
                                setForm((p) => ({
                                  ...p,
                                  specifications: p.specifications.filter((_, i) => i !== idx),
                                }));
                              }}
                              title="Remove this specification"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>
                        <button
                          type="button"
                          className="admin-spec-table__add-btn"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              specifications: [...(p.specifications || []), { key: '', value: '' }],
                            }))
                          }
                        >
                          <FiPlus /> Add Row
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {errors.specifications && (
                <p className="admin-field__error">
                  <FiAlertCircle /> {errors.specifications}
                </p>
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
