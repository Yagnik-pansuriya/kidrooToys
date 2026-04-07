import React from 'react';
import './ConfirmDeleteModal.scss';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, title = "Confirm Deletion" }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal__title">{title}</h3>
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
