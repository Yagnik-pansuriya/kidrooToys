import React from 'react';
import { FiX } from 'react-icons/fi';

const OfferPreviewModal = ({ preview, onClose }) => {
  if (!preview) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>Offer Preview</h2>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="offer-preview">
          <div className="offer-preview__banner"
            style={{
              background: /^#[0-9A-Fa-f]{6}$/.test(preview.styling?.bgColor) ? preview.styling.bgColor : '#FF6B35',
              color: /^#[0-9A-Fa-f]{6}$/.test(preview.styling?.textColor) ? preview.styling.textColor : '#fff',
            }}>
            {preview.images && preview.images.length > 0 && (
              <div className="offer-preview__images">
                {preview.images.map((img, i) => (
                  <img key={i} src={img.url || img} alt={img.altText || preview.title} />
                ))}
              </div>
            )}
            <div className="offer-preview__content">
              <h3>{preview.title}</h3>
              {preview.subtitle && <p>{preview.subtitle}</p>}
              {preview.description && <p className="offer-preview__desc">{preview.description}</p>}
            </div>
          </div>
          <div className="offer-preview__meta">
            <p><strong>Display Type:</strong> {preview.displayType}</p>
            <p><strong>Page:</strong> {preview.placement?.page} · {preview.placement?.section || 'main'}</p>
            <p><strong>Position:</strong> {preview.placement?.position ?? 0}</p>
            <p><strong>Status:</strong> {preview.isActive ? 'Active' : 'Inactive'}</p>
            {preview.targetUrl && <p><strong>Link:</strong> {preview.targetUrl}</p>}
            {preview.validity?.from && (
              <p><strong>Valid:</strong> {new Date(preview.validity.from).toLocaleDateString()} — {new Date(preview.validity.to).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
