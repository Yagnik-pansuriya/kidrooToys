import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiLoader } from 'react-icons/fi';
import {
  useGetProductsQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useToast } from '../../../context/ToastContext';
import './AdminProducts.scss';

// Dynamic categories from Redux store/API instead of hardcoded list

const emptyForm = {
  productName: '',
  slug: '',
  description: '',
  price: '',
  originalPrice: '',
  discountPercentage: '',
  stock: '',
  category: '',
  ratings: '',
  numReviews: '',
  featured: false,
  newArrival: false,
  bestSeller: false,
  ageRangeFrom: '',
  ageRangeTo: '',
  tags: '',
  isActive: true,
  images: [],          // File objects for NEW uploads
  previewUrls: [],     // Data-URL strings for preview
};

const AdminProducts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);   // null = add mode, else product object
  const [form, setForm] = useState(emptyForm);
  const [apiError, setApiError] = useState('');
  const { showSuccess, showError } = useToast();
  // ── RTK Query hooks & Redux ────────────────────────────────────
  const { isLoading: loadingProducts } = useGetProductsQuery();
  const { isLoading: loadingCategories } = useGetCategoriesQuery();
  const [addProduct,    { isLoading: adding }]   = useAddProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const productList = useSelector((state) => state.product.products) || [];
  const productsArray = Array.isArray(productList) ? productList : (productList?.data || []);
  const categoryOptions = useSelector((state) => state.category.categories) || [];
  const isBusy = adding || updating;

  // ── Modal helpers ──────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setApiError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      productName: product.productName || product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      discountPercentage: product.discountPercentage ?? '',
      stock: product.stock ?? '',
      category: (product.category?._id || product.category) || '',
      ratings: product.ratings ?? '',
      numReviews: product.numReviews ?? '',
      featured: product.featured ?? false,
      newArrival: product.newArrival ?? false,
      bestSeller: product.bestSeller ?? false,
      ageRangeFrom: product.ageRange?.from ?? '',
      ageRangeTo: product.ageRange?.to ?? '',
      tags: Array.isArray(product.tags) ? product.tags.join(',') : (product.tags || ''),
      isActive: product.isActive ?? true,
      images: [],
      previewUrls: product.images || [],
    });
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Image picker (up to 5, add individually) ──────────────────
  const fileInputRef = useRef(null);

  const handleAddImages = (e) => {
    const incoming = Array.from(e.target.files);
    // reset input so the same file can be re-selected if removed
    e.target.value = '';

    setForm((p) => {
      const remaining = 5 - p.images.length;
      if (remaining <= 0) return p;
      const newFiles = incoming.slice(0, remaining);
      const newUrls  = newFiles.map((f) => URL.createObjectURL(f));
      return {
        ...p,
        images:      [...p.images, ...newFiles],
        previewUrls: [...p.previewUrls, ...newUrls],
      };
    });
  };

  const handleRemoveImage = (index) => {
    setForm((p) => {
      const imgs = p.images.filter((_, i) => i !== index);
      const urls = p.previewUrls.filter((_, i) => i !== index);
      return { ...p, images: imgs, previewUrls: urls };
    });
  };

  // ── Build FormData matching API
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('productName', form.productName);
    fd.append('slug', form.slug);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('originalPrice', form.originalPrice);
    fd.append('discountPercentage', form.discountPercentage);
    fd.append('stock', form.stock);
    fd.append('category', form.category);
    fd.append('ratings', form.ratings);
    fd.append('numReviews', form.numReviews);
    fd.append('featured', form.featured);
    fd.append('newArrival', form.newArrival);
    fd.append('bestSeller', form.bestSeller);
    fd.append('ageRange', JSON.stringify({ from: Number(form.ageRangeFrom), to: Number(form.ageRangeTo) }));
    fd.append('tags', form.tags);
    fd.append('isActive', form.isActive);
    form.images.forEach((file) => fd.append('images', file));
    return fd;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const fd = buildFormData();

    try {
      if (editing) {
        await updateProduct({ id: editing._id || editing.id, formData: fd }).unwrap();
        showSuccess('Product updated successfully');
      } else {
        await addProduct(fd).unwrap();
        showSuccess('Product added successfully');
      }
      closeModal();
    } catch (err) {
      const msg = err?.data?.message || 'Something went wrong. Please try again.';
      setApiError(msg);
      showError(msg);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product._id || product.id).unwrap();
      showSuccess('Product deleted successfully');
    } catch (err) {
      const msg = err?.data?.message || 'Delete failed. Please try again.';
      alert(msg);
      showError(msg);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="admin-products">
      {/* Header */}
      <div className="admin-products__header">
        <h1>Products 📦</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Table */}
      {loadingProducts ? (
        <div className="admin-loading">Loading products…</div>
      ) : (
        <div className="admin-products__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsArray.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No products yet.</td></tr>
              )}
              {productsArray.map((product) => {
                const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                return (
                  <tr key={product._id || product.id}>
                    <td>
                      {imgSrc
                        ? <img src={imgSrc} alt={product.productName || product.name} className="admin-products__thumb" />
                        : <div className="admin-products__thumb admin-products__thumb--placeholder"><FiImage /></div>
                      }
                    </td>
                    <td className="td-bold">{product.productName || product.name}</td>
                    <td><span className="admin-tag">{product.category?.catagoryName || product.category}</span></td>
                    <td className="td-bold">${Number(product.price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status ${product.stock > 0 ? 'status--delivered' : 'status--cancelled'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn admin-action-btn--edit"
                          onClick={() => openEdit(product)}
                          title="Edit"
                          disabled={deleting}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => handleDelete(product)}
                          title="Delete"
                          disabled={deleting}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal}><FiX /></button>
            </div>

            <form className="admin-modal__form" onSubmit={handleSubmit}>
              {apiError && <div className="admin-login__error" style={{ marginBottom: '1rem' }}>{apiError}</div>}

              <div className="admin-form-grid">
                {/* Product Name */}
                <div className="admin-field admin-field--full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))}
                    placeholder="e.g. Wooden Toy Car"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="admin-field">
                  <label>Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="e.g. wooden-toy-car"
                    required
                  />
                </div>

                {/* Price */}
                <div className="admin-field">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="29.99"
                    required
                  />
                </div>

                {/* Original Price */}
                <div className="admin-field">
                  <label>Original Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
                    placeholder="39.99"
                    required
                  />
                </div>

                {/* Discount Percentage */}
                <div className="admin-field">
                  <label>Discount Percentage *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discountPercentage}
                    onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))}
                    placeholder="25"
                    required
                  />
                </div>

                {/* Stock */}
                <div className="admin-field">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                    placeholder="100"
                    required
                  />
                </div>

                {/* Ratings */}
                <div className="admin-field">
                  <label>Ratings *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.ratings}
                    onChange={(e) => setForm((p) => ({ ...p, ratings: e.target.value }))}
                    placeholder="4.5"
                    required
                  />
                </div>

                {/* Num Reviews */}
                <div className="admin-field">
                  <label>Num Reviews *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.numReviews}
                    onChange={(e) => setForm((p) => ({ ...p, numReviews: e.target.value }))}
                    placeholder="120"
                    required
                  />
                </div>

                {/* Category */}
                <div className="admin-field">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.catagoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="admin-field">
                  <label>Tags * (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="wooden,car,toy"
                    required
                  />
                </div>

                {/* Age Range From */}
                <div className="admin-field">
                  <label>Age Range From *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.ageRangeFrom}
                    onChange={(e) => setForm((p) => ({ ...p, ageRangeFrom: e.target.value }))}
                    placeholder="3"
                    required
                  />
                </div>

                {/* Age Range To */}
                <div className="admin-field">
                  <label>Age Range To *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.ageRangeTo}
                    onChange={(e) => setForm((p) => ({ ...p, ageRangeTo: e.target.value }))}
                    placeholder="8"
                    required
                  />
                </div>

                {/* Booleans / Toggles */}
                <div className="admin-field">
                  <label>Featured</label>
                  <select value={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.value === 'true' }))}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>New Arrival</label>
                  <select value={form.newArrival} onChange={(e) => setForm((p) => ({ ...p, newArrival: e.target.value === 'true' }))}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>Best Seller</label>
                  <select value={form.bestSeller} onChange={(e) => setForm((p) => ({ ...p, bestSeller: e.target.value === 'true' }))}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>Is Active</label>
                  <select value={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === 'true' }))}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                {/* Description */}
                <div className="admin-field admin-field--full">
                  <label>Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="High-quality wooden toy car…"
                    required
                  />
                </div>

                {/* Images (up to 5) */}
                <div className="admin-field admin-field--full">
                  <label><FiImage /> Product Images (up to 5)</label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleAddImages}
                  />

                  {/* Preview grid + Add slot */}
                  <div className="admin-image-grid">
                    {form.previewUrls.map((url, i) => (
                      <div key={i} className="admin-image-slot admin-image-slot--filled">
                        <img src={url} alt={`Preview ${i + 1}`} />
                        <button
                          type="button"
                          className="admin-image-slot__remove"
                          onClick={() => handleRemoveImage(i)}
                          title="Remove"
                        >
                          <FiX />
                        </button>
                        <span className="admin-image-slot__num">{i + 1}</span>
                      </div>
                    ))}

                    {/* Add-more slot — shown only if < 5 images */}
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
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={isBusy}>
                  {isBusy
                    ? <><FiLoader className="spin" /> Saving…</>
                    : <>{editing ? 'Update' : 'Add'} Product</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
