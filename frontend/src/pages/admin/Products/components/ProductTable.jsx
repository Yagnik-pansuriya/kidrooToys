import { useState, useRef } from 'react';
import { FiEdit2, FiTrash2, FiImage, FiLayers, FiMove, FiCheck } from 'react-icons/fi';

/**
 * ProductTable with drag-and-drop reordering + inline position editing
 *
 * Props:
 *  products     {Array}    Current page's product list
 *  searchQuery  {string}   Active search string (for empty-state message)
 *  deleting     {boolean}  Disable actions while a delete is in flight
 *  onEdit       {fn}       Called with the product object to edit
 *  onDelete     {fn}       Called with the product object to delete
 *  onVariants   {fn}       Called with the product object to manage variants
 *  onReorder    {fn}       Called with array of { id, position } after drag-drop
 *  onMovePosition {fn}     Called with { id, targetPosition } for cross-page move
 *  movingId     {string|null}  ID of the product currently being moved (shows spinner)
 */
const ProductTable = ({ products = [], searchQuery = '', deleting, onEdit, onDelete, onVariants, onReorder, onMovePosition, movingId, totalItems, onToggleStatus }) => {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [editingPosId, setEditingPosId] = useState(null);
  const [editingPosValue, setEditingPosValue] = useState('');
  const posInputRef = useRef(null);

  // Sort by position
  const sorted = [...products].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const onDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newOrder = [...sorted];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(overIdx, 0, moved);

      // Preserve the existing position values but redistribute them
      // in the new order. This prevents page 2 from getting positions 0-9
      // which would duplicate page 1 positions.
      const existingPositions = sorted.map((p) => p.position ?? 0);
      const items = newOrder.map((p, i) => ({
        id: p._id || p.id,
        position: existingPositions[i],
      }));
      onReorder?.(items);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  // ── Position editing handlers ──
  const startEditPos = (product) => {
    setEditingPosId(product._id || product.id);
    setEditingPosValue(String(product.position ?? 0));
    setTimeout(() => posInputRef.current?.select(), 50);
  };

  const cancelEditPos = () => {
    setEditingPosId(null);
    setEditingPosValue('');
  };

  const submitEditPos = (product) => {
    const newPos = parseInt(editingPosValue, 10);
    const currentPos = product.position ?? 0;
    const maxPos = (totalItems || sorted.length) - 1;

    if (isNaN(newPos) || newPos < 0) {
      cancelEditPos();
      return;
    }

    // Clamp to valid range: 0 to totalItems - 1
    const clampedPos = Math.min(newPos, Math.max(maxPos, 0));

    if (clampedPos === currentPos) {
      cancelEditPos();
      return;
    }

    onMovePosition?.({
      id: product._id || product.id,
      targetPosition: clampedPos,
    });
    cancelEditPos();
  };

  const handlePosKeyDown = (e, product) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitEditPos(product);
    } else if (e.key === 'Escape') {
      cancelEditPos();
    }
  };

  return (
    <table className="admin-table" aria-label="Products table">
      <thead>
        <tr>
          <th style={{ width: 40 }}>#</th>
          <th>Image</th>
          <th>Name</th>
          <th>Categories</th>
          <th>Price</th>
          <th>Pos</th>
          <th>Stock</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {sorted.length === 0 && (
          <tr>
            <td colSpan={8} className="admin-table__empty">
              {searchQuery
                ? `No products found for "${searchQuery}".`
                : 'No products yet. Click "Add Product" to create one.'}
            </td>
          </tr>
        )}

        {sorted.map((product, idx) => {
          const imgSrc = Array.isArray(product.images)
            ? product.images[0]
            : product.image;

          const name     = product.productName || product.name;
          const price    = Number(product.price || 0).toFixed(2);
          // When hasVariants is true, product.stock is forced to 0 by backend.
          // Check the default variant's stock for the real stock status.
          const resolvedStock = (() => {
            if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
              const defV = product.variants.find((v) => typeof v === 'object' && v.isDefault);
              if (defV) return defV.stock ?? 0;
              // If no default variant found, sum all variant stocks
              return product.variants.reduce((sum, v) => sum + (typeof v === 'object' ? (v.stock || 0) : 0), 0);
            }
            return product.stock || 0;
          })();
          const inStock  = resolvedStock > 0;

          // Resolve categories: new multi-category array or legacy single
          const categoryNames = (() => {
            if (Array.isArray(product.categories) && product.categories.length > 0) {
              return product.categories.map((c) =>
                typeof c === 'object' ? (c.catagoryName || c.name || 'Unknown') : c
              );
            }
            // Legacy fallback
            if (product.category) {
              const n = typeof product.category === 'object'
                ? (product.category.catagoryName || product.category.name)
                : product.category;
              return n ? [n] : [];
            }
            return [];
          })();

          const productId = product._id || product.id;
          const isMoving = movingId === productId;
          const isEditingPos = editingPosId === productId;
          const isActive = product.isActive !== false;

          return (
            <tr
              key={productId}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver(e, idx)}
              className={`${dragIdx === idx ? 'dragging' : ''} ${overIdx === idx && dragIdx !== idx ? 'drag-over' : ''} ${!isActive ? 'row--inactive' : ''}`}
              style={{ cursor: 'grab' }}
            >
              {/* Drag handle */}
              <td>
                <span className="drag-handle" title="Drag to reorder"><FiMove /></span>
              </td>

              {/* Thumbnail */}
              <td>
                {imgSrc ? (
                  <img src={imgSrc} alt={name} className="admin-products__thumb" loading="lazy" />
                ) : (
                  <div className="admin-products__thumb admin-products__thumb--placeholder">
                    <FiImage aria-hidden="true" />
                  </div>
                )}
              </td>

              {/* Name */}
              <td className="td-bold">{name}</td>

              {/* Categories */}
              <td>
                <div className="admin-tag-group">
                  {categoryNames.length > 0 ? categoryNames.map((cn, i) => (
                    <span key={i} className="admin-tag">{cn}</span>
                  )) : (
                    <span className="admin-tag admin-tag--muted">Uncategorized</span>
                  )}
                </div>
              </td>

              {/* Price */}
              <td className="td-bold">₹{price}</td>

              {/* Position — editable */}
              <td>
                {isEditingPos ? (
                  <div className="position-edit">
                    <input
                      ref={posInputRef}
                      type="number"
                      min="0"
                      max={Math.max((totalItems || sorted.length) - 1, 0)}
                      className="position-edit__input"
                      value={editingPosValue}
                      onChange={(e) => setEditingPosValue(e.target.value)}
                      onKeyDown={(e) => handlePosKeyDown(e, product)}
                      onBlur={() => cancelEditPos()}
                      placeholder={`0–${Math.max((totalItems || sorted.length) - 1, 0)}`}
                      autoFocus
                    />
                    <button
                      className="position-edit__confirm"
                      onMouseDown={(e) => { e.preventDefault(); submitEditPos(product); }}
                      title="Set position"
                    >
                      <FiCheck />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`admin-tag position-tag ${isMoving ? 'position-tag--loading' : ''}`}
                    style={{ minWidth: 32, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => !isMoving && startEditPos(product)}
                    title={`Click to set position (0–${Math.max((totalItems || sorted.length) - 1, 0)})`}
                  >
                    {isMoving ? '…' : (product.position ?? idx)}
                  </span>
                )}
              </td>

              {/* Stock status */}
              <td>
                <span className={`status ${inStock ? 'status--delivered' : 'status--cancelled'}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>

              {/* Active toggle */}
              <td>
                <button
                  className={`status-toggle ${isActive ? 'status-toggle--active' : 'status-toggle--inactive'}`}
                  onClick={() => onToggleStatus?.(product)}
                  title={isActive ? 'Click to deactivate' : 'Click to activate'}
                  disabled={deleting}
                >
                  <span className="status-toggle__track">
                    <span className="status-toggle__thumb" />
                  </span>
                  <span className="status-toggle__label">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </td>

              {/* Actions */}
              <td>
                <div className="admin-actions">
                  <button
                    className="admin-action-btn admin-action-btn--variants"
                    onClick={() => onVariants(product)}
                    disabled={deleting}
                    title="Manage variants"
                  >
                    <FiLayers />
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--edit"
                    onClick={() => onEdit(product)}
                    disabled={deleting}
                    title="Edit product"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--delete"
                    onClick={() => onDelete(product)}
                    disabled={deleting}
                    title="Delete product"
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
};

export default ProductTable;
