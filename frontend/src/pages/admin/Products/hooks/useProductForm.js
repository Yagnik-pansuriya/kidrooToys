import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../../../../context/ToastContext';
import { emptyForm, generateProductCode, MAX_IMAGES, validateProductForm } from '../constants/productConstants';
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
  const [errors,    setErrors]    = useState({});
  const [productToDelete, setProductToDelete] = useState(null);
  const [apiError,  setApiError]  = useState('');

  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, productCode: generateProductCode() });
    setErrors({});
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

    setForm({
      productName:        product.productName || product.name || '',
      slug:               product.slug || '',
      productCode:        product.productCode || '',
      description:        product.description || '',
      price:              product.price ?? '',
      originalPrice:      product.originalPrice ?? '',
      discountPercentage: product.discountPercentage ?? '',
      stock:              product.stock ?? '',
      categories:         resolvedCategories,
      ratings:            product.ratings ?? '',
      numReviews:         product.numReviews ?? '',
      featured:           product.featured ?? false,
      newArrival:         product.newArrival ?? false,
      bestSeller:         product.bestSeller ?? false,
      ageRange:            (() => {
                              // New format: array of strings like ['0-2', '4-6']
                              if (Array.isArray(product.ageRange)) return product.ageRange;
                              // Old format: single string like '0-2'
                              if (typeof product.ageRange === 'string' && product.ageRange) return [product.ageRange];
                              // Legacy format: { from, to } → map to closest option
                              if (product.ageRange && typeof product.ageRange === 'object') {
                                const f = product.ageRange.from ?? 0;
                                const t = product.ageRange.to;
                                if (t === undefined || t === null) return ['8+'];
                                return [`${f}-${t}`];
                              }
                              return [];
                            })(),
      tags:               Array.isArray(product.tags)
                            ? product.tags
                            : (typeof product.tags === 'string' && product.tags
                                ? product.tags.split(',')
                                : []),
      isActive:           product.isActive ?? true,
      youtubeUrl:         product.youtubeUrl || '',
      youtubeUrl2:        product.youtubeUrl2 || '',
      skuCode:            product.skuCode || '',
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
      // ── SEO ──
      seoKeywords: Array.isArray(product.seoKeywords)
                     ? product.seoKeywords.join(',')
                     : (product.seoKeywords || ''),
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      // ── Specifications ──
      specifications: Array.isArray(product.specifications)
        ? product.specifications.map((s) => ({ key: s.key || '', value: s.value || '' }))
        : [],
    });
    setErrors({});
    setApiError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Image handlers ───────────────────────────────────────────
  const handleAddImages = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = ''; // allow re-selecting same file

    setForm((prev) => {
      const slots     = MAX_IMAGES - prev.images.length;
      if (slots <= 0) return prev;
      const newFiles  = incoming.slice(0, slots);
      const newUrls   = newFiles.map((f) => URL.createObjectURL(f));
      return {
        ...prev,
        images:      [...prev.images, ...newFiles],
        previewUrls: [...prev.previewUrls, ...newUrls],
      };
    });
    clearError('images');
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
      'productName', 'slug', 'productCode', 'description', 'youtubeUrl', 'youtubeUrl2',
      'warrantyType', 'guaranteeTerms', 'seoKeywords',
      'seoTitle', 'seoDescription', 'skuCode',
    ];
    stringFields.forEach((key) => fd.append(key, form[key] ?? ''));

    // Tags (bullet points) — send as JSON array
    if (Array.isArray(form.tags) && form.tags.length > 0) {
      const validTags = form.tags.filter((t) => t.trim());
      fd.append('tags', JSON.stringify(validTags));
    } else {
      fd.append('tags', '[]');
    }

    // ageRange — send as comma-separated string
    if (Array.isArray(form.ageRange) && form.ageRange.length > 0) {
      fd.append('ageRange', form.ageRange.join(','));
    } else {
      fd.append('ageRange', '');
    }

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
      'featured', 'newArrival', 'bestSeller', 'isActive',
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

    form.images.forEach((file) => fd.append('images', file));

    // Specifications — send as JSON string
    if (Array.isArray(form.specifications) && form.specifications.length > 0) {
      const validSpecs = form.specifications.filter((s) => s.key.trim() || s.value.trim());
      fd.append('specifications', JSON.stringify(validSpecs));
    } else {
      fd.append('specifications', '[]');
    }

    return fd;
  };

  // ── Submit (add / update) ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Frontend validation check
    const validationErrors = validateProductForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstMsg = Object.values(validationErrors)[0];
      setApiError(firstMsg || 'Please fix the highlighted errors before submitting.');
      showError('Please fix the errors in the form before submitting.');

      setTimeout(() => {
        const errEl = document.querySelector('.admin-field--error, .has-error, .admin-field__error');
        if (errEl) {
          errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

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
    errors,
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
    setErrors,
    clearError,
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
