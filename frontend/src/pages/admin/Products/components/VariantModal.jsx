import { useState, useRef } from 'react';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiLoader, FiPackage, FiImage } from 'react-icons/fi';
import Loader from '../../../../components/Loader/Loader';
import {
  useGetVariantsQuery,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from '../../../../store/ActionApi/variantApi';
import { useToast } from '../../../../context/ToastContext';

// ─── Empty variant form ───────────────────────────────────────────────────────
const emptyVariant = {
  sku:           '',
  barcode:       '',
  price:         '',
  originalPrice: '',
  stock:         '',
  lowStockAlert: '',
  weight:        '',
  dimLength:     '',   // ─┐ combined into dimensions JSON on submit
  dimWidth:      '',   //  │
  dimHeight:     '',   // ─┘
  status:        'active',
  isDefault:     false,
  isActive:      true,
  imageFiles:    [],   // File objects for new uploads (up to 5)
  previewUrls:   [],   // blob URLs (new) or remote URLs (existing)
  attributes:    [{ key: '', value: '' }],
};

// ─── VariantForm ──────────────────────────────────────────────────────────────
const VariantForm = ({ initial, onSave, onCancel, isBusy }) => {
  const [form, setForm] = useState(initial);
  const fileInputRef    = useRef(null);

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const boolField = (key) => ({
    value:    String(form[key]),
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value === 'true' })),
  });

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleAddImages = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = '';
    setForm((prev) => {
      const slots    = 5 - prev.previewUrls.length;
      if (slots <= 0) return prev;
      const newFiles = incoming.slice(0, slots);
      const newUrls  = newFiles.map((f) => URL.createObjectURL(f));
      return {
        ...prev,
        imageFiles:  [...prev.imageFiles, ...newFiles],
        previewUrls: [...prev.previewUrls, ...newUrls],
      };
    });
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      imageFiles:  prev.imageFiles.filter((_, i) => i !== index),
      previewUrls: prev.previewUrls.filter((_, i) => i !== index),
    }));
  };

  // ── Attributes helpers ────────────────────────────────────────────────────
  const setAttr = (index, part, value) =>
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((a, i) =>
        i === index ? { ...a, [part]: value } : a
      ),
    }));

  const addAttr = () =>
    setForm((p) => ({ ...p, attributes: [...p.attributes, { key: '', value: '' }] }));

  const removeAttr = (index) =>
    setForm((p) => ({
      ...p,
      attributes: p.attributes.filter((_, i) => i !== index),
    }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const attrsObj = {};
    form.attributes.forEach(({ key, value }) => {
      if (key.trim()) attrsObj[key.trim()] = value;
    });

    onSave({
      sku:           form.sku,
      barcode:       form.barcode,
      price:         Number(form.price),
      originalPrice: Number(form.originalPrice),
      stock:         Number(form.stock),
      lowStockAlert: form.lowStockAlert !== '' ? Number(form.lowStockAlert) : undefined,
      weight:        form.weight        !== '' ? Number(form.weight)        : undefined,
      dimensions:    {                          // serialised to JSON in buildVariantFormData
        length: Number(form.dimLength) || 0,
        width:  Number(form.dimWidth)  || 0,
        height: Number(form.dimHeight) || 0,
      },
      status:        form.status,
      isDefault:     form.isDefault,
      isActive:      form.isActive,
      imageFiles:    form.imageFiles,
      previewUrls:   form.previewUrls,
      attributes:    attrsObj,
    });
  };

  return (
    <form className="variant-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-form-grid">

        {/* ── Identity ── */}
        <div className="admin-field">
          <label>SKU *</label>
          <input type="text" placeholder="TOY-CAR-RED-001" required {...field('sku')} />
        </div>

        <div className="admin-field">
          <label>Barcode</label>
          <input type="text" placeholder="1234567890123" {...field('barcode')} />
        </div>

        {/* ── Pricing ── */}
        <div className="admin-field">
          <label>Price *</label>
          <input type="number" step="0.01" min="0" placeholder="29.99" required {...field('price')} />
        </div>

        <div className="admin-field">
          <label>Original Price</label>
          <input type="number" step="0.01" min="0" placeholder="39.99" {...field('originalPrice')} />
        </div>

        {/* ── Inventory ── */}
        <div className="admin-field">
          <label>Stock *</label>
          <input type="number" min="0" placeholder="50" required {...field('stock')} />
        </div>

        <div className="admin-field">
          <label>Low Stock Alert</label>
          <input type="number" min="0" placeholder="5" {...field('lowStockAlert')} />
        </div>

        {/* ── Physical ── */}
        <div className="admin-field">
          <label>Weight (kg)</label>
          <input type="number" step="0.01" min="0" placeholder="0.5" {...field('weight')} />
        </div>

        {/* Dimensions — 3 compact inputs in one field */}
        <div className="admin-field">
          <label>Dimensions (cm) — L × W × H</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min="0" step="0.1" placeholder="L" {...field('dimLength')} style={{ flex: 1 }} />
            <input type="number" min="0" step="0.1" placeholder="W" {...field('dimWidth')}  style={{ flex: 1 }} />
            <input type="number" min="0" step="0.1" placeholder="H" {...field('dimHeight')} style={{ flex: 1 }} />
          </div>
        </div>

        {/* ── Status ── */}
        <div className="admin-field">
          <label>Status</label>
          <select {...field('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>

        <div className="admin-field">
          <label>Is Active</label>
          <select {...boolField('isActive')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="admin-field">
          <label>Is Default</label>
          <select {...boolField('isDefault')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {/* ── Images (up to 5) — same grid as ProductModal ── */}
        <div className="admin-field admin-field--full">
          <label><FiImage aria-hidden="true" /> Variant Images (up to 5)</label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleAddImages}
          />

          <div className="admin-image-grid">
            {form.previewUrls.map((url, i) => (
              <div key={i} className="admin-image-slot admin-image-slot--filled">
                <img src={url} alt={`Variant image ${i + 1}`} />
                <button
                  type="button"
                  className="admin-image-slot__remove"
                  onClick={() => handleRemoveImage(i)}
                  aria-label={`Remove image ${i + 1}`}
                >
                  <FiX />
                </button>
                <span className="admin-image-slot__num">{i + 1}</span>
              </div>
            ))}

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

      {/* ── Dynamic Attributes (JSON stringified) ── */}
      <div className="variant-attrs">
        <div className="variant-attrs__header">
          <span>Attributes <small style={{ opacity: 0.6 }}>(JSON stringified)</small></span>
          <button type="button" className="variant-attrs__add-btn" onClick={addAttr}>
            <FiPlus /> Add Attribute
          </button>
        </div>

        {form.attributes.map((attr, i) => (
          <div key={i} className="variant-attrs__row">
            <input
              type="text"
              placeholder="e.g. Color"
              value={attr.key}
              onChange={(e) => setAttr(i, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="e.g. Red"
              value={attr.value}
              onChange={(e) => setAttr(i, 'value', e.target.value)}
            />
            {form.attributes.length > 1 && (
              <button
                type="button"
                className="variant-attrs__remove-btn"
                onClick={() => removeAttr(i)}
                aria-label="Remove attribute"
              >
                <FiX />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="variant-form__actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={isBusy}>
          {isBusy ? <><FiLoader className="spin" /> Saving…</> : 'Save Variant'}
        </button>
      </div>
    </form>
  );
};

// ─── VariantRow ───────────────────────────────────────────────────────────────
const VariantRow = ({ variant, onEditClick, onDelete, deleting }) => {
  const attrs    = variant.attributes || {};
  const thumbSrc = Array.isArray(variant.images)
    ? variant.images[0]
    : variant.image || null;

  return (
    <div className="variant-row">
      <div className="variant-row__img">
        {thumbSrc
          ? <img src={thumbSrc} alt={variant.sku} />
          : <div className="variant-row__img-placeholder"><FiPackage /></div>
        }
      </div>

      <div className="variant-row__info">
        <p className="variant-row__sku">{variant.sku}</p>
        {variant.barcode && <p className="variant-row__barcode">#{variant.barcode}</p>}
        <div className="variant-row__attrs">
          {Object.entries(attrs).map(([k, v]) => (
            <span key={k} className="admin-tag">{k}: {v}</span>
          ))}
        </div>
        <div className="variant-row__meta">
          <span className="variant-row__price">${Number(variant.price || 0).toFixed(2)}</span>
          {variant.originalPrice > 0 && (
            <span className="variant-row__original">${Number(variant.originalPrice).toFixed(2)}</span>
          )}
          <span className={`status ${(variant.status === 'active' || (!variant.status && variant.isActive)) ? 'status--delivered' : 'status--cancelled'}`} style={{ textTransform: 'capitalize' }}>
            {variant.status ? variant.status.replace(/_/g, ' ') : (variant.isActive ? 'Active' : 'Inactive')}
          </span>
          <span className="variant-row__stock">Stock: {variant.stock}</span>
          {variant.isDefault && <span className="admin-tag">Default</span>}
        </div>
      </div>

      <div className="admin-actions">
        <button
          className="admin-action-btn admin-action-btn--edit"
          onClick={() => onEditClick(variant)}
          title="Edit variant"
          aria-label={`Edit ${variant.sku}`}
        >
          <FiEdit2 />
        </button>
        <button
          className="admin-action-btn admin-action-btn--delete"
          onClick={() => onDelete(variant)}
          disabled={deleting}
          title="Delete variant"
          aria-label={`Delete ${variant.sku}`}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

// ─── VariantModal (main export) ───────────────────────────────────────────────
const VariantModal = ({ product, onClose }) => {
  const productId = product._id || product.id;
  const { showSuccess, showError } = useToast();

  const { data: variantsData, isLoading, isFetching } = useGetVariantsQuery(productId, {
    skip: !productId,
  });
  const [addVariant,    { isLoading: adding }]   = useAddVariantMutation();
  const [updateVariant, { isLoading: updating }] = useUpdateVariantMutation();
  const [deleteVariant, { isLoading: deleting }] = useDeleteVariantMutation();

  const [view, setView]                    = useState('list');
  const [editingVariant, setEditingVariant] = useState(null);

  const variants = Array.isArray(variantsData)
    ? variantsData
    : variantsData?.data || variantsData?.variants || [];

  const buildAttrsArray = (attrsObj) => {
    const entries = Object.entries(attrsObj || {});
    return entries.length > 0
      ? entries.map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];
  };

  const openEdit = (variant) => {
    const existingUrls = Array.isArray(variant.images)
      ? variant.images
      : variant.image
        ? [variant.image]
        : [];

    // dimensions may come as object { length, width, height } from API
    const dim = variant.dimensions || {};

    setEditingVariant({
      ...variant,
      barcode:       variant.barcode       ?? '',
      lowStockAlert: variant.lowStockAlert ?? '',
      weight:        variant.weight        ?? '',
      dimLength:     dim.length            ?? '',
      dimWidth:      dim.width             ?? '',
      dimHeight:     dim.height            ?? '',
      status:        variant.status        || 'active',
      isDefault:     variant.isDefault     ?? false,
      isActive:      variant.isActive      ?? true,
      imageFiles:    [],
      previewUrls:   existingUrls,
      attributes:    buildAttrsArray(variant.attributes),
    });
    setView('edit');
  };

  const handleAdd = async (body) => {
    try {
      await addVariant({ productId, body }).unwrap();
      showSuccess('Variant added');
      setView('list');
    } catch (err) {
      showError(err?.data?.message || 'Failed to add variant');
    }
  };

  const handleUpdate = async (body) => {
    try {
      await updateVariant({ variantId: editingVariant._id || editingVariant.id, productId, body }).unwrap();
      showSuccess('Variant updated');
      setView('list');
      setEditingVariant(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update variant');
    }
  };

  const handleDelete = async (variant) => {
    if (!window.confirm(`Delete variant "${variant.sku}"?`)) return;
    try {
      await deleteVariant({ variantId: variant._id || variant.id, productId }).unwrap();
      showSuccess('Variant deleted');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete variant');
    }
  };

  const isBusy = adding || updating;

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>

        <div className="admin-modal__header">
          <div className="admin-modal__header-left">
            {view !== 'list' && (
              <button
                type="button"
                className="variant-back-btn"
                onClick={() => { setView('list'); setEditingVariant(null); }}
              >
                ← Back to list
              </button>
            )}
            <h2>
              {view === 'list' && <>Variants — <em>{product.productName || product.name}</em></>}
              {view === 'add'  && 'Add Variant'}
              {view === 'edit' && 'Edit Variant'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>

        <div className="admin-modal__form">

          {view === 'list' && (
            <>
              <div className="variant-list-header">
                <span className="variant-list-count">
                  {isLoading ? 'Loading…' : `${variants.length} variant${variants.length !== 1 ? 's' : ''}`}
                </span>
                <button className="admin-btn admin-btn--primary" onClick={() => setView('add')}>
                  <FiPlus /> Add Variant
                </button>
              </div>

              {isLoading || isFetching ? (
                <Loader inline message="Loading variants…" />
              ) : variants.length === 0 ? (
                <div className="variant-empty">
                  <FiPackage />
                  <p>No variants yet. Click "Add Variant" to create one.</p>
                </div>
              ) : (
                <div className="variant-list">
                  {variants.map((v) => (
                    <VariantRow
                      key={v._id || v.id}
                      variant={v}
                      onEditClick={openEdit}
                      onDelete={handleDelete}
                      deleting={deleting}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'add' && (
            <VariantForm
              initial={emptyVariant}
              onSave={handleAdd}
              onCancel={() => setView('list')}
              isBusy={isBusy}
            />
          )}

          {view === 'edit' && editingVariant && (
            <VariantForm
              initial={editingVariant}
              onSave={handleUpdate}
              onCancel={() => { setView('list'); setEditingVariant(null); }}
              isBusy={isBusy}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default VariantModal;
