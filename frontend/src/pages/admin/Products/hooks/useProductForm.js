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
  const [productToDelete, setProductToDelete] = useState(null);
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

    // Resolve categories: backend now returns populated `categories` array
    const resolvedCategories = (() => {
      // If product has `categories` array (new multi-category schema)
      if (Array.isArray(product.categories) && product.categories.length > 0) {
        return product.categories.map((c) =>
          typeof c === 'object' ? (c._id || c.id) : c
        );
      }
      // Legacy fallback: single `category`
      if (product.category) {
        const id = typeof product.category === 'object'
          ? (product.category._id || product.category.id)
          : product.category;
        return id ? [id] : [];
      }
      return [];
    })();

    // When hasVariants is true, product.stock is always forced to 0 by the backend.
    // The real stock lives on the default variant — use that for the edit form.
    const resolvedStock = (() => {
      if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
        const defaultVariant = product.variants.find(
          (v) => typeof v === 'object' && v.isDefault
        );
        if (defaultVariant) return defaultVariant.stock ?? 0;
      }
      return product.stock ?? '';
    })();

    setForm({
      productName:        product.productName || product.name || '',
      slug:               product.slug || '',
      description:        product.description || '',
      price:              product.price ?? '',
      originalPrice:      product.originalPrice ?? '',
      discountPercentage: product.discountPercentage ?? '',
      stock:              resolvedStock,
      categories:         resolvedCategories,
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
      youtubeUrl:         product.youtubeUrl || '',
      hasVariants:        product.hasVariants ?? false,
      variants:           Array.isArray(product.variants) ? product.variants : [],
      images:             [],
      previewUrls:        product.images || [],
      // ── Warranty / Guarantee ──
      hasWarranty:        product.hasWarranty ?? false,
      warrantyPeriod:     product.warrantyPeriod ?? '',
      warrantyType:       product.warrantyType || 'manufacturer',
      hasGuarantee:       product.hasGuarantee ?? false,
      guaranteePeriod:    product.guaranteePeriod ?? '',
      guaranteeTerms:     product.guaranteeTerms || '',
      // ── Skills ──
      skills: Array.isArray(product.skills)
        ? product.skills.map((s) => typeof s === 'object' ? (s._id || s.id) : s)
        : [],
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

    // String fields — always send
    const stringFields = [
      'productName', 'slug', 'description', 'tags', 'youtubeUrl',
      'warrantyType', 'guaranteeTerms',
    ];
    stringFields.forEach((key) => fd.append(key, form[key] ?? ''));

    // Numeric fields — convert empty string to '0' so the backend
    // never receives a blank that might silently become NaN or get
    // dropped.  The value '0' is a valid intentional value.
    const numericFields = [
      'price', 'originalPrice', 'discountPercentage', 'stock',
      'ratings', 'numReviews', 'warrantyPeriod', 'guaranteePeriod',
    ];
    numericFields.forEach((key) => {
      const v = form[key];
      fd.append(key, (v === '' || v === null || v === undefined) ? '0' : String(v));
    });

    // Boolean fields — always send
    const boolFields = [
      'featured', 'newArrival', 'bestSeller', 'isActive', 'hasVariants',
      'hasWarranty', 'hasGuarantee',
    ];
    boolFields.forEach((key) => fd.append(key, String(!!form[key])));

    if (Array.isArray(form.categories) && form.categories.length > 0) {
      fd.append('categories', form.categories.join(','));
    }

    // Send skills as comma-separated string
    if (Array.isArray(form.skills) && form.skills.length > 0) {
      fd.append('skills', form.skills.join(','));
    }

    fd.append(
      'ageRange',
      JSON.stringify({
        from: Number(form.ageRangeFrom) || 0,
        to: Number(form.ageRangeTo) || 0,
      })
    );
    // variants: only send during create — during update, variants are managed
    // by the variant CRUD endpoints and synced via syncDefaultVariant.
    // Sending them here during edit could accidentally overwrite the variants array.
    if (!editing) {
      fd.append('variants', JSON.stringify(form.hasVariants ? form.variants : []));
    }
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
  const handleDelete = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete._id || productToDelete.id).unwrap();
      showSuccess('Product deleted successfully');
    } catch (err) {
      const msg = err?.data?.message || 'Delete failed. Please try again.';
      showError(msg);
    } finally {
      setProductToDelete(null);
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
    productToDelete,
    setProductToDelete,
    confirmDelete,
  };
};

export default useProductForm;
