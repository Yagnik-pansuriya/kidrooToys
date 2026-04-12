import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus } from 'react-icons/fi';
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} from '../../../store/ActionApi/categoryApi';
import { useToast } from '../../../context/ToastContext';

// Components
import CategoryTable from './components/CategoryTable';
import CategoryFormModal from './components/CategoryFormModal';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';

const AdminCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catToDelete, setCatToDelete] = useState(null);
  const [apiError, setApiError] = useState('');
  const { showSuccess, showError } = useToast();

  // RTK Query hooks & Redux
  const { isLoading: loadingCategories } = useGetCategoriesQuery();
  const [addCategory, { isLoading: adding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();
  const [reorderCategories] = useReorderCategoriesMutation();

  const categoryList = useSelector((state) => state.category.categories) || [];
  const isBusy = adding || updating;

  // Modal helpers
  const openAdd = () => {
    setEditingCategory(null);
    setApiError('');
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Submit Handler
  const handleSubmit = async (form) => {
    setApiError('');
    const fd = new FormData();
    fd.append('catagoryName', form.catagoryName);
    fd.append('slug', form.slug);
    fd.append('count', form.count);
    if (form.image) fd.append('image', form.image);
    if (form.icon) fd.append('icon', form.icon);

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory._id || editingCategory.id, formData: fd }).unwrap();
        showSuccess('Category updated successfully');
      } else {
        await addCategory(fd).unwrap();
        showSuccess('Category added successfully');
      }
      closeModal();
    } catch (err) {
      const msg = err?.data?.message || 'Something went wrong. Please try again.';
      setApiError(msg);
      showError(msg);
    }
  };

  // Delete Handler
  const handleDelete = (category) => {
    setCatToDelete(category);
  };

  const confirmDelete = async () => {
    if (!catToDelete) return;
    try {
      await deleteCategory(catToDelete._id || catToDelete.id).unwrap();
      showSuccess('Category deleted successfully');
    } catch (err) {
      const msg = err?.data?.message || 'Delete failed. Please try again.';
      showError(msg);
    } finally {
      setCatToDelete(null);
    }
  };

  // Reorder Handler (from drag-and-drop)
  const handleReorder = async (items) => {
    try {
      await reorderCategories(items).unwrap();
      showSuccess('Categories reordered');
    } catch (err) {
      showError(err?.data?.message || 'Reorder failed');
    }
  };

  return (
    <div className="admin-products">
      {/* Header */}
      <div className="admin-products__header">
        <h1>Categories 📂</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Table with drag-and-drop */}
      <CategoryTable
        categories={categoryList}
        loading={loadingCategories}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={deleting}
        onReorder={handleReorder}
      />

      {/* Add / Edit Modal */}
      <CategoryFormModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingCategory={editingCategory}
        isSubmitting={isBusy}
        apiError={apiError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={confirmDelete}
        itemName={catToDelete?.catagoryName}
        title="Delete Category?"
      />
    </div>
  );
};

export default AdminCategories;
