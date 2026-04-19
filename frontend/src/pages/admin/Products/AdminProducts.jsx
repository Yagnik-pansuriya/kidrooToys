import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus } from 'react-icons/fi';
import Loader from '../../../components/Loader/Loader';

import {
  useGetProductsQuery,
  useReorderProductsMutation,
} from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';
import { useGetSkillsQuery } from '../../../store/ActionApi/skillApi';

import Pagination       from '../../../components/Pagination/Pagination';
import ProductSearchBar from './components/ProductSearchBar';
import ProductFilters   from './components/ProductFilters';
import ProductTable     from './components/ProductTable';
import ProductModal     from './components/ProductModal';
import VariantModal     from './components/VariantModal';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
import useProductForm   from './hooks/useProductForm';

import { PRODUCTS_PER_PAGE } from './constants/productConstants';
import './AdminProducts.scss';

// ── Default filter state ────────────────────────────────────────
const defaultFilters = {
  category:   '',
  minPrice:   '',
  maxPrice:   '',
  featured:   '',
  newArrival: '',
  bestSeller: '',
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminProducts = () => {
  // ── Search state ─────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filter state ─────────────────────────────────────────────
  const [filters, setFilters] = useState({ ...defaultFilters });

  // ── Live Search effect ───────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInput.trim()) {
        setSearchQuery(searchInput.trim());
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  // ── Pagination state ─────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Data fetching ─────────────────────────────────────────────
  const { isLoading: loadingProducts } = useGetProductsQuery(
    {
      page,
      limit: PRODUCTS_PER_PAGE,
      search: searchQuery,
      ...filters,
    },
    { refetchOnMountOrArgChange: true }
  );
  useGetCategoriesQuery(); // pre-load categories for form select & filter dropdown

  // ── Redux selectors ───────────────────────────────────────────
  const productList   = useSelector((s) => s.product.products) || [];
  const totalPages    = useSelector((s) => s.product.totalPages);
  const totalItems    = useSelector((s) => s.product.total);
  const productsArray = Array.isArray(productList)
    ? productList
    : productList?.data || [];

  // ── Categories for filter dropdown ────────────────────────────
  const categories = useSelector((s) => s.category.categories) || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.data || [];

  // ── Form / CRUD logic (custom hook) ──────────────────────────
  const {
    showModal, editing, form, apiError,
    isBusy, deleting,
    categoryOptions, fileInputRef,
    setForm,
    openAdd, openEdit, closeModal,
    handleAddImages, handleRemoveImage,
    handleSubmit, handleDelete,
    productToDelete, setProductToDelete, confirmDelete,
  } = useProductForm();

  // ── Skills ──────────────────────────────────────────────────
  const { data: skillsResp } = useGetSkillsQuery();
  const skillsRaw = skillsResp?.data || skillsResp || [];
  const skillOptions = Array.isArray(skillsRaw) ? skillsRaw : [];

  // ── Reorder mutation ─────────────────────────────────────────
  const [reorderProducts] = useReorderProductsMutation();

  // ── Variant modal state ───────────────────────────────────────
  const [variantProduct, setVariantProduct] = useState(null);
  const openVariants  = useCallback((product) => setVariantProduct(product), []);
  const closeVariants = useCallback(() => setVariantProduct(null), []);

  // ── Search handlers ───────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }, []);

  // ── Filter handlers ───────────────────────────────────────────
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({ ...defaultFilters });
    setPage(1);
  }, []);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  // ── Pagination handler ────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Reorder handler (from drag-and-drop) ─────────────────────
  const handleReorder = async (items) => {
    try {
      await reorderProducts(items).unwrap();
    } catch (err) {
      console.error('Reorder failed', err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-products">

      {/* ── Page header ── */}
      <div className="admin-products__header">
        <h1>Products 📦</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus aria-hidden="true" /> Add Product
        </button>
      </div>

      {/* ── Search bar ── */}
      <ProductSearchBar
        searchInput={searchInput}
        searchQuery={searchQuery}
        onInputChange={setSearchInput}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
      />

      {/* ── Filters ── */}
      <ProductFilters
        filters={filters}
        categories={categoryList}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
        activeCount={activeFilterCount}
      />

      {/* ── Table area ── */}
      {loadingProducts ? (
        <Loader inline message="Loading products…" />
      ) : (
        <div className="admin-products__table-wrap">
          <ProductTable
            products={productsArray}
            searchQuery={searchQuery}
            deleting={deleting}
            onEdit={openEdit}
            onDelete={handleDelete}
            onVariants={openVariants}
            onReorder={handleReorder}
          />

          {/* ── Pagination ── */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={PRODUCTS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {showModal && (
        <ProductModal
          editing={editing}
          form={form}
          apiError={apiError}
          isBusy={isBusy}
          categoryOptions={categoryOptions}
          skillOptions={skillOptions}
          fileInputRef={fileInputRef}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
        />
      )}

      {/* ── Variants modal ── */}
      {variantProduct && (
        <VariantModal
          product={variantProduct}
          onClose={closeVariants}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        itemName={productToDelete?.productName || productToDelete?.name}
        title="Delete Product?"
      />

    </div>
  );
};

export default AdminProducts;
