import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../../../../context/ToastContext';
import { emptyForm } from '../constants/productConstants';
import { useAddProductMutation, useDeleteProductMutation, useUpdateProductMutation } from '../../../../store/ActionApi/productApi';

/**
 * useProductForm
 * Encapsulates all form state, image handling, and CRUD mutations
 * for the AdminProducts page.
 */
const useProductForm = () => {
  // ── Mutations ────────────────────────────────────────────────
  const [addProduct,    { isLoading: adding }]   = useAddProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  // ── Redux selectors ──────────────────────────────────────────
  const categoryOptions = useSelector((s) => s.category.categories) || [];

  // ── Modal / form local state ─────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);   // null = add mode
  const [form,      setForm]      = useState(emptyForm);
  const [apiError,  setApiError]  = useState('');

  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setApiError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      productName:        product.productName || product.name || '',
      slug:               product.slug || '',
      description:        product.description || '',
      price:              product.price ?? '',
      originalPrice:      product.originalPrice ?? '',
      discountPercentage: product.discountPercentage ?? '',
      stock:              product.stock ?? '',
      category:           product.category?._id || product.category || '',
      ratings:            product.ratings ?? '',
      numReviews:         product.numReviews ?? '',
      featured:           product.featured ?? false,
      newArrival:         product.newArrival ?? false,
      bestSeller:         product.bestSeller ?? false,
      ageRangeFrom:       product.ageRange?.from ?? '',
      ageRangeTo:         product.ageRange?.to ?? '',
      tags:               Array.isArray(product.tags)
                            ? product.tags.join(',')
                            : (product.tags || ''),
      isActive:           product.isActive ?? true,
      hasVariants:        product.hasVariants ?? false,
      variants:           Array.isArray(product.variants) ? product.variants : [],
      images:             [],
      previewUrls:        product.images || [],
    });
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Image handlers ───────────────────────────────────────────
  const handleAddImages = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = ''; // allow re-selecting same file

    setForm((prev) => {
      const slots     = 5 - prev.images.length;
      if (slots <= 0) return prev;
      const newFiles  = incoming.slice(0, slots);
      const newUrls   = newFiles.map((f) => URL.createObjectURL(f));
      return {
        ...prev,
        images:      [...prev.images, ...newFiles],
        previewUrls: [...prev.previewUrls, ...newUrls],
      };
    });
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images:      prev.images.filter((_, i) => i !== index),
      previewUrls: prev.previewUrls.filter((_, i) => i !== index),
    }));
  };

  // ── Build FormData ───────────────────────────────────────────
  const buildFormData = () => {
    const fd = new FormData();
    const fields = [
      'productName', 'slug', 'description', 'price', 'originalPrice',
      'discountPercentage', 'stock', 'category', 'ratings', 'numReviews',
      'featured', 'newArrival', 'bestSeller', 'tags', 'isActive', 'hasVariants',
    ];
    fields.forEach((key) => fd.append(key, form[key]));
    fd.append(
      'ageRange',
      JSON.stringify({ from: Number(form.ageRangeFrom), to: Number(form.ageRangeTo) })
    );
    // variants: send as JSON array (backend expects array of strings)
    fd.append('variants', JSON.stringify(form.hasVariants ? form.variants : []));
    form.images.forEach((file) => fd.append('images', file));
    return fd;
  };

  // ── Submit (add / update) ────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (product) => {
    const name = product.productName || product.name;
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(product._id || product.id).unwrap();
      showSuccess('Product deleted successfully');
    } catch (err) {
      const msg = err?.data?.message || 'Delete failed. Please try again.';
      showError(msg);
    }
  };

  return {
    // state
    showModal,
    editing,
    form,
    apiError,
    fileInputRef,
    categoryOptions,
    // loading flags
    adding,
    updating,
    deleting,
    isBusy: adding || updating,
    // handlers
    setForm,
    openAdd,
    openEdit,
    closeModal,
    handleAddImages,
    handleRemoveImage,
    handleSubmit,
    handleDelete,
  };
};

export default useProductForm;
