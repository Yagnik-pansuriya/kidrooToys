import React, { useState, useRef } from 'react';
import { FiEdit2, FiTrash2, FiImage, FiCheckCircle, FiMove, FiCheck } from 'react-icons/fi';
import Loader from '../../../../components/Loader/Loader';

const CategoryTable = ({ categories, loading, onEdit, onDelete, deleting, onReorder, onMovePosition, movingId }) => {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [editingPosId, setEditingPosId] = useState(null);
  const [editingPosValue, setEditingPosValue] = useState('');
  const dragRef = useRef(null);
  const posInputRef = useRef(null);

  if (loading) {
    return <Loader inline message="Loading categories…" />;
  }

  // ── Sorted by position ──
  const sorted = [...categories].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // ── Drag handlers ──
  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    dragRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    const el = e.currentTarget;
    el.style.opacity = '0.5';
  };

  const onDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newOrder = [...sorted];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(overIdx, 0, moved);

      // Preserve the existing position values but redistribute them
      // in the new order. This prevents duplicate positions across pages.
      const existingPositions = sorted.map((cat) => cat.position ?? 0);
      const items = newOrder.map((cat, i) => ({
        id: cat._id || cat.id,
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
  const startEditPos = (category) => {
    setEditingPosId(category._id || category.id);
    setEditingPosValue(String(category.position ?? 0));
    setTimeout(() => posInputRef.current?.select(), 50);
  };

  const cancelEditPos = () => {
    setEditingPosId(null);
    setEditingPosValue('');
  };

  const submitEditPos = (category) => {
    const newPos = parseInt(editingPosValue, 10);
    const currentPos = category.position ?? 0;
    const maxPos = sorted.length - 1;

    if (isNaN(newPos) || newPos < 0) {
      cancelEditPos();
      return;
    }

    // Clamp to valid range: 0 to total - 1
    const clampedPos = Math.min(newPos, Math.max(maxPos, 0));

    if (clampedPos === currentPos) {
      cancelEditPos();
      return;
    }

    onMovePosition?.({
      id: category._id || category.id,
      targetPosition: clampedPos,
    });
    cancelEditPos();
  };

  const handlePosKeyDown = (e, category) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitEditPos(category);
    } else if (e.key === 'Escape') {
      cancelEditPos();
    }
  };

  return (
    <div className="admin-products__table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Icon</th>
            <th>Image</th>
            <th>Category Name</th>
            <th>Slug</th>
            <th>Pos</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No categories yet.</td></tr>
          )}
          {sorted.map((category, idx) => {
            const categoryId = category._id || category.id;
            const isMoving = movingId === categoryId;
            const isEditingPos = editingPosId === categoryId;

            return (
              <tr
                key={categoryId}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOver(e, idx)}
                className={`${dragIdx === idx ? 'dragging' : ''} ${overIdx === idx && dragIdx !== idx ? 'drag-over' : ''}`}
                style={{ cursor: 'grab' }}
              >
                <td>
                  <span className="drag-handle" title="Drag to reorder"><FiMove /></span>
                </td>
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

                {/* Position — editable */}
                <td>
                  {isEditingPos ? (
                    <div className="position-edit">
                      <input
                        ref={posInputRef}
                        type="number"
                        min="0"
                        max={Math.max(sorted.length - 1, 0)}
                        className="position-edit__input"
                        value={editingPosValue}
                        onChange={(e) => setEditingPosValue(e.target.value)}
                        onKeyDown={(e) => handlePosKeyDown(e, category)}
                        onBlur={() => cancelEditPos()}
                        placeholder={`0–${Math.max(sorted.length - 1, 0)}`}
                        autoFocus
                      />
                      <button
                        className="position-edit__confirm"
                        onMouseDown={(e) => { e.preventDefault(); submitEditPos(category); }}
                        title="Set position"
                      >
                        <FiCheck />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`admin-tag position-tag ${isMoving ? 'position-tag--loading' : ''}`}
                      style={{ minWidth: 32, textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => !isMoving && startEditPos(category)}
                      title={`Click to set position (0–${Math.max(sorted.length - 1, 0)})`}
                    >
                      {isMoving ? '…' : (category.position ?? idx)}
                    </span>
                  )}
                </td>

                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-action-btn admin-action-btn--edit"
                      onClick={() => onEdit(category)}
                      title="Edit"
                      disabled={deleting}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--delete"
                      onClick={() => onDelete(category)}
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
  );
};

export default CategoryTable;
