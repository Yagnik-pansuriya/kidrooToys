import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiLoader } from 'react-icons/fi';
import {
  useGetProductsQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../../store/ActionApi/productApi';
import './AdminProducts.scss';

const CATEGORIES = ['vehicles', 'dolls', 'puzzles', 'blocks', 'outdoor', 'educational', 'arts', 'sports'];

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  images: [],          // File objects for NEW uploads
  previewUrls: [],     // Data-URL strings for preview
};

const AdminProducts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);   // null = add mode, else product object
  const [form, setForm] = useState(emptyForm);
  const [apiError, setApiError] = useState('');

  // ── RTK Query hooks ────────────────────────────────────────────
  const { data: productsData, isLoading: loadingProducts } = useGetProductsQuery();
  const [addProduct,    { isLoading: adding }]   = useAddProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const productList = productsData?.data || productsData || [];
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
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      category: product.category || '',
      images: [],
      previewUrls: product.images || [],
    });
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Image picker (up to 5) ─────────────────────────────────────
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const urls = files.map((f) => URL.createObjectURL(f));
    setForm((p) => ({ ...p, images: files, previewUrls: urls }));
  };

  // ── Build FormData matching API: name, description, price, category, images[] ──
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
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
      } else {
        await addProduct(fd).unwrap();
      }
      closeModal();
    } catch (err) {
      setApiError(err?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product._id || product.id).unwrap();
    } catch (err) {
      alert(err?.data?.message || 'Delete failed. Please try again.');
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
              {productList.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No products yet.</td></tr>
              )}
              {productList.map((product) => {
                const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                return (
                  <tr key={product._id || product.id}>
                    <td>
                      {imgSrc
                        ? <img src={imgSrc} alt={product.name} className="admin-products__thumb" />
                        : <div className="admin-products__thumb admin-products__thumb--placeholder"><FiImage /></div>
                      }
                    </td>
                    <td className="td-bold">{product.name}</td>
                    <td><span className="admin-tag">{product.category}</span></td>
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
                {/* Name */}
                <div className="admin-field admin-field--full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Wooden Toy Car"
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

                {/* Category */}
                <div className="admin-field">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="admin-field admin-field--full">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="High-quality wooden toy car…"
                  />
                </div>

                {/* Images (up to 5) */}
                <div className="admin-field admin-field--full">
                  <label><FiImage /> Product Images (up to 5)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  {/* Preview grid */}
                  {form.previewUrls.length > 0 && (
                    <div className="admin-field__previews">
                      {form.previewUrls.map((url, i) => (
                        <img key={i} src={url} alt={`Preview ${i + 1}`} className="admin-field__preview" />
                      ))}
                    </div>
                  )}
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
