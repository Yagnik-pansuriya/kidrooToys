import React, { useState, useRef } from 'react';
import { FiEdit2, FiTrash2, FiImage, FiCheckCircle, FiMove } from 'react-icons/fi';
import Loader from '../../../../components/Loader/Loader';

const CategoryTable = ({ categories, loading, onEdit, onDelete, deleting, onReorder }) => {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragRef = useRef(null);

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

      // Build position map and call parent
      const items = newOrder.map((cat, i) => ({
        id: cat._id || cat.id,
        position: i,
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
          {sorted.map((category, idx) => (
            <tr
              key={category._id || category.id}
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
              <td><span className="admin-tag" style={{ minWidth: 32, textAlign: 'center' }}>{category.position ?? idx}</span></td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
