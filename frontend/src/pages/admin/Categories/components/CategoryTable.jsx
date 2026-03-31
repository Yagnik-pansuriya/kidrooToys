import React from 'react';
import { FiEdit2, FiTrash2, FiImage, FiCheckCircle } from 'react-icons/fi';
import Loader from '../../../../components/Loader/Loader';

const CategoryTable = ({ categories, loading, onEdit, onDelete, deleting }) => {
  if (loading) {
    return <Loader inline message="Loading categories…" />;
  }

  return (
    <div className="admin-products__table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Image</th>
            <th>Category Name</th>
            <th>Slug</th>
            <th>Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No categories yet.</td></tr>
          )}
          {categories.map((category) => (
            <tr key={category._id || category.id}>
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
              <td>{category.count}</td>
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
