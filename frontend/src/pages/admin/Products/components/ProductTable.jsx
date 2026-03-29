import { FiEdit2, FiTrash2, FiImage, FiLayers } from 'react-icons/fi';

/**
 * ProductTable
 *
 * Props:
 *  products     {Array}    Current page's product list
 *  searchQuery  {string}   Active search string (for empty-state message)
 *  deleting     {boolean}  Disable actions while a delete is in flight
 *  onEdit       {fn}       Called with the product object to edit
 *  onDelete     {fn}       Called with the product object to delete
 *  onVariants   {fn}       Called with the product object to manage variants
 */
const ProductTable = ({ products = [], searchQuery = '', deleting, onEdit, onDelete, onVariants }) => (
  <table className="admin-table" aria-label="Products table">
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
      {/* ── Empty state ── */}
      {products.length === 0 && (
        <tr>
          <td colSpan={6} className="admin-table__empty">
            {searchQuery
              ? `No products found for "${searchQuery}".`
              : 'No products yet. Click "Add Product" to create one.'}
          </td>
        </tr>
      )}

      {/* ── Product rows ── */}
      {products.map((product) => {
        const imgSrc = Array.isArray(product.images)
          ? product.images[0]
          : product.image;

        const name     = product.productName || product.name;
        const category = product.category?.catagoryName || product.category;
        const price    = Number(product.price || 0).toFixed(2);
        const inStock  = product.stock > 0;

        return (
          <tr key={product._id || product.id}>
            {/* Thumbnail */}
            <td>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="admin-products__thumb"
                  loading="lazy"
                />
              ) : (
                <div className="admin-products__thumb admin-products__thumb--placeholder">
                  <FiImage aria-hidden="true" />
                </div>
              )}
            </td>

            {/* Name */}
            <td className="td-bold">{name}</td>

            {/* Category */}
            <td>
              <span className="admin-tag">{category}</span>
            </td>

            {/* Price */}
            <td className="td-bold">${price}</td>

            {/* Stock status */}
            <td>
              <span className={`status ${inStock ? 'status--delivered' : 'status--cancelled'}`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </td>

            {/* Actions */}
            <td>
              <div className="admin-actions">
                {/* Variants */}
                <button
                  className="admin-action-btn admin-action-btn--variants"
                  onClick={() => onVariants(product)}
                  disabled={deleting}
                  title="Manage variants"
                  aria-label={`Manage variants for ${name}`}
                >
                  <FiLayers />
                </button>

                <button
                  className="admin-action-btn admin-action-btn--edit"
                  onClick={() => onEdit(product)}
                  disabled={deleting}
                  title="Edit product"
                  aria-label={`Edit ${name}`}
                >
                  <FiEdit2 />
                </button>

                <button
                  className="admin-action-btn admin-action-btn--delete"
                  onClick={() => onDelete(product)}
                  disabled={deleting}
                  title="Delete product"
                  aria-label={`Delete ${name}`}
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
);

export default ProductTable;
