import React from 'react';
import { FiX } from 'react-icons/fi';
import OfferRenderer from '../../../../components/OfferRenderer/OfferRenderer';

const OfferPreviewModal = ({ preview, onClose }) => {
  if (!preview) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>Preview: {preview.title}</h2>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="admin-offer-preview">
          <OfferRenderer offer={preview} />
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
