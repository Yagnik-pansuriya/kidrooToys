import { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiLoader, FiCheckCircle } from 'react-icons/fi';
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../store/ActionApi/categoryApi';

const emptyForm = {
  catagoryName: '',
  slug: '',
  count: 0,
  image: null,
  icon: null,
  previewImage: null,
  previewIcon: null,
};

const AdminCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [apiError, setApiError] = useState('');

  // ── RTK Query hooks & Redux ────────────────────────────────────
  const { isLoading: loadingCategories } = useGetCategoriesQuery();
  const [addCategory,    { isLoading: adding }]   = useAddCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const categoryList = useSelector((state) => state.category.categories) || [];
  const isBusy = adding || updating;

  // ── Modal helpers ──────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setApiError('');
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      catagoryName: category.catagoryName || '',
      slug: category.slug || '',
      count: category.count ?? 0,
      image: null,
      icon: null,
      previewImage: category.image || null,
      previewIcon: category.icon || null,
    });
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Image pickers ─────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, image: file, previewImage: URL.createObjectURL(file) }));
    }
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, icon: file, previewIcon: URL.createObjectURL(file) }));
    }
  };

  // ── Build FormData ─────────────────────────────────────────────
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('catagoryName', form.catagoryName);
    fd.append('slug', form.slug);
    fd.append('count', form.count);
    if (form.image) fd.append('image', form.image);
    if (form.icon) fd.append('icon', form.icon);
    return fd;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const fd = buildFormData();

    try {
      if (editing) {
        await updateCategory({ id: editing._id || editing.id, formData: fd }).unwrap();
      } else {
        await addCategory(fd).unwrap();
      }
      closeModal();
    } catch (err) {
      setApiError(err?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.catagoryName}"?`)) return;
    try {
      await deleteCategory(category._id || category.id).unwrap();
    } catch (err) {
      alert(err?.data?.message || 'Delete failed. Please try again.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="admin-products">
      {/* Header */}
      <div className="admin-products__header">
        <h1>Categories 📂</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Table */}
      {loadingCategories ? (
        <div className="admin-loading">Loading categories…</div>
      ) : (
        <div className="admin-products__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Image</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoryList.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No categories yet.</td></tr>
              )}
              {categoryList.map((category) => (
                <tr key={category._id || category.id}>
                  <td>
                    {category.icon ? (
                      <img src={category.icon} alt="Icon" className="admin-products__thumb" style={{ width: '40px', height: '40px'}} />
                    ) : (
                      <div className="admin-products__thumb admin-products__thumb--placeholder" style={{ width: '40px', height: '40px'}}><FiCheckCircle /></div>
                    )}
                  </td>
                  <td>
                    {category.image ? (
                      <img src={category.image} alt="Image" className="admin-products__thumb" />
                    ) : (
                      <div className="admin-products__thumb admin-products__thumb--placeholder"><FiImage /></div>
                    )}
                  </td>
                  <td className="td-bold">{category.catagoryName}</td>
                  <td><span className="admin-tag">{category.slug}</span></td>
                  <td>{category.count}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => openEdit(category)}
                        title="Edit"
                        disabled={deleting}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => handleDelete(category)}
                        title="Delete"
                        disabled={deleting}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={closeModal}><FiX /></button>
            </div>

            <form className="admin-modal__form" onSubmit={handleSubmit}>
              {apiError && <div className="admin-login__error" style={{ marginBottom: '1rem' }}>{apiError}</div>}

              <div className="admin-form-grid">
                {/* Category Name */}
                <div className="admin-field admin-field--full">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={form.catagoryName}
                    onChange={(e) => setForm((p) => ({ ...p, catagoryName: e.target.value }))}
                    placeholder="e.g. Wooden Toys"
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
                    placeholder="e.g. wooden-toys"
                    required
                  />
                </div>

                {/* Count */}
                <div className="admin-field">
                  <label>Count *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.count}
                    onChange={(e) => setForm((p) => ({ ...p, count: e.target.value }))}
                    required
                  />
                </div>

                {/* Cover Image */}
                <div className="admin-field admin-field--full">
                  <label><FiImage /> Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {form.previewImage && (
                    <img src={form.previewImage} alt="Preview Image" style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px' }} />
                  )}
                </div>

                {/* Icon */}
                <div className="admin-field admin-field--full">
                  <label><FiCheckCircle /> Icon</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                  />
                  {form.previewIcon && (
                    <img src={form.previewIcon} alt="Preview Icon" style={{ width: '50px', height: '50px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px' }} />
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
                    : <>{editing ? 'Update' : 'Add'} Category</>
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

export default AdminCategories;
