import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiLoader } from 'react-icons/fi';

import {
  useGetProductsQuery,
} from '../../../store/ActionApi/productApi';
import { useGetCategoriesQuery } from '../../../store/ActionApi/categoryApi';

import Pagination      from '../../../components/Pagination/Pagination';
import ProductSearchBar from './components/ProductSearchBar';
import ProductTable     from './components/ProductTable';
import ProductModal     from './components/ProductModal';
import useProductForm   from './hooks/useProductForm';

import { PRODUCTS_PER_PAGE } from './constants/productConstants';
import './AdminProducts.scss';

// ─────────────────────────────────────────────────────────────────────────────
const AdminProducts = () => {
  // ── Search state ─────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Pagination state ─────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Data fetching ─────────────────────────────────────────────
  const { isLoading: loadingProducts } = useGetProductsQuery(
    { page, limit: PRODUCTS_PER_PAGE, search: searchQuery },
    { refetchOnMountOrArgChange: true }
  );
  useGetCategoriesQuery(); // pre-load categories for form select

  // ── Redux selectors ───────────────────────────────────────────
  const productList = useSelector((s) => s.product.products) || [];
  const totalPages  = useSelector((s) => s.product.totalPages);
  const totalItems  = useSelector((s) => s.product.total);
  const productsArray = Array.isArray(productList)
    ? productList
    : productList?.data || [];

  // ── Form / CRUD logic (custom hook) ──────────────────────────
  const {
    showModal, editing, form, apiError,
    isBusy, deleting,
    categoryOptions, fileInputRef,
    setForm,
    openAdd, openEdit, closeModal,
    handleAddImages, handleRemoveImage,
    handleSubmit, handleDelete,
  } = useProductForm();

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

  // ── Pagination handler ────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

      {/* ── Table area ── */}
      {loadingProducts ? (
        <div className="admin-loading" role="status">
          <FiLoader className="spin" aria-hidden="true" /> Loading products…
        </div>
      ) : (
        <div className="admin-products__table-wrap">
          <ProductTable
            products={productsArray}
            searchQuery={searchQuery}
            deleting={deleting}
            onEdit={openEdit}
            onDelete={handleDelete}
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
          fileInputRef={fileInputRef}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
        />
      )}

    </div>
  );
};

export default AdminProducts;
