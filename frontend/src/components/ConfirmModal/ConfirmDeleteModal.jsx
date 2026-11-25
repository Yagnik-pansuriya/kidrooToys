import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import './ConfirmDeleteModal.scss';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, title = "Confirm Deletion" }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal" role="alertdialog" aria-labelledby="confirm-modal-title">
        <span className="confirm-modal__icon" aria-hidden="true"><FiAlertTriangle /></span>
        <h3 className="confirm-modal__title" id="confirm-modal-title">{title}</h3>
        <p className="confirm-modal__message">
          Are you sure you want to delete <strong>{itemName || 'this item'}</strong>?<br/>
          This action cannot be undone.
        </p>
        <div className="confirm-modal__actions">
          <button className="admin-btn admin-btn--secondary" onClick={onClose} aria-label="Cancel deletion">
            Cancel
          </button>
          <button className="admin-btn admin-btn--danger" onClick={onConfirm} aria-label="Confirm deletion">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
