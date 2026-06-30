import React from 'react';
import { displayTypes, pageTargets, sectionPresets } from '../constants/offerConstants';

const OfferTableRow = ({ offer, onEdit, onDelete, onToggleStatus }) => {
  const displayLabel = displayTypes.find(t => t.value === offer.displayType)?.label || offer.displayType;
  const pageLabel = pageTargets.find(p => p.value === offer.placement?.page)?.label || offer.placement?.page;
  const isExpired = offer.validity?.to && new Date(offer.validity.to) < new Date();
  
  // Safe colors for icon box
  const bgColor = /^#[0-9A-Fa-f]{6}$/.test(offer.styling?.bgColor) ? offer.styling.bgColor : '#FF6B35';

  const getStatusBadge = () => {
    if (isExpired) return <span className="badge badge-expired">Expired</span>;
    if (offer.isActive) return <span className="badge badge-active">Active</span>;
    return <span className="badge badge-inactive">Inactive</span>;
  };

  const getTypeIcon = () => {
    switch (offer.displayType) {
      case 'slider': return '📦';
      case 'top-banner': return '📢';
      case 'promo-section': return '⚡';
      default: return '🎟️';
    }
  };

  const getTypeBadgeClass = () => {
    switch (offer.displayType) {
      case 'slider': return 'badge-bundle';
      case 'top-banner': return 'badge-shipping';
      case 'promo-section': return 'badge-flash';
      default: return 'badge-type';
    }
  };

  // Extract label without emojis
  const cleanDisplayLabel = displayLabel ? displayLabel.replace(/[^a-zA-Z\s]/g, '').trim() : 'Offer';

  return (
    <tr>
      <td>
        <div className="offer-name-cell">
          <div className="offer-icon-box" style={{ background: `${bgColor}33`, color: bgColor }}>
            {getTypeIcon()}
          </div>
          <div>
            <div className="offer-name">{offer.title}</div>
            <div className="offer-type-tag">{offer.subtitle || 'No subtitle'}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={`badge ${getTypeBadgeClass()}`}>
          {cleanDisplayLabel}
        </span>
      </td>
      <td>
        <strong>{offer.discount || 'N/A'}</strong>
      </td>
      <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '140px' }}>
        {pageLabel}
      </td>
      <td style={{ fontSize: '13px' }}>
        {offer.validity?.to ? new Date(offer.validity.to).toLocaleDateString() : 'No expiry'}
      </td>
      <td>
        {/* Static Uses for mockup */}
        <div style={{ fontSize: '13px', fontWeight: 700 }}>
          {offer.uses || Math.floor(Math.random() * 200)} / {offer.limit || '∞'}
        </div>
        <div className="mini-progress">
          <div className="mini-progress-fill" style={{ width: `${Math.random() * 100}%` }}></div>
        </div>
      </td>
      <td>
        <div className="toggle-wrap">
          <button 
            className={`toggle ${offer.isActive ? 'on' : ''}`} 
            onClick={() => onToggleStatus(offer)} 
            aria-label="Toggle offer"
          />
          {getStatusBadge()}
        </div>
      </td>
      <td>
        <div className="action-btns">
          <button className="btn btn-outline btn-sm" onClick={() => onEdit(offer)}>✏️ Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(offer._id || offer.id)}>🗑️</button>
        </div>
      </td>
    </tr>
  );
};

export default OfferTableRow;
