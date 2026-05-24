import React from 'react';
import { FiEdit2, FiTrash2, FiMapPin, FiCalendar, FiImage, FiLayers } from 'react-icons/fi';
import { displayTypes, pageTargets, sectionPresets } from '../constants/offerConstants';

const OfferCard = ({ offer, onEdit, onDelete }) => {
  const displayLabel = displayTypes.find(t => t.value === offer.displayType)?.label || offer.displayType;
  const pageLabel = pageTargets.find(p => p.value === offer.placement?.page)?.label || offer.placement?.page;
  const isExpired = offer.validity?.to && new Date(offer.validity.to) < new Date();
  const isNotStarted = offer.validity?.from && new Date(offer.validity.from) > new Date();

  // Get section label
  const sections = sectionPresets[offer.placement?.page] || [];
  const sectionLabel = sections.find(s => s.value === offer.placement?.section)?.label || offer.placement?.section;

  // Safe colors
  const bgColor = /^#[0-9A-Fa-f]{6}$/.test(offer.styling?.bgColor) ? offer.styling.bgColor : '#FF6B35';
  const textColor = /^#[0-9A-Fa-f]{6}$/.test(offer.styling?.textColor) ? offer.styling.textColor : '#FFFFFF';

  return (
    <div className={`admin-offer-card ${!offer.isActive ? 'admin-offer-card--inactive' : ''} ${isExpired ? 'admin-offer-card--expired' : ''}`}>
      {/* Image preview */}
      {offer.images && offer.images.length > 0 && (
        <div className="admin-offer-card__preview" style={{ background: `linear-gradient(135deg, ${bgColor}33, ${bgColor}11)` }}>
          <img src={offer.images[0].url || offer.images[0]} alt={offer.title} />
          {offer.images.length > 1 && (
            <span className="admin-offer-card__img-count">+{offer.images.length - 1}</span>
          )}
        </div>
      )}

      <div className="admin-offer-card__body">
        <div className="admin-offer-card__tags">
          <span className={`admin-offer-card__type admin-offer-card__type--${offer.displayType}`}>
            {offer.displayType === 'slider' ? <FiLayers /> : <FiImage />} {displayLabel}
          </span>
          <span className={`admin-offer-card__status ${offer.isActive ? 'admin-offer-card__status--active' : 'admin-offer-card__status--inactive'}`}>
            {offer.isActive ? '● Active' : '○ Inactive'}
          </span>
          {isExpired && <span className="admin-offer-card__status admin-offer-card__status--expired">⏰ Expired</span>}
          {isNotStarted && <span className="admin-offer-card__status admin-offer-card__status--upcoming">🕐 Upcoming</span>}
        </div>

        <h3 className="admin-offer-card__title">{offer.title}</h3>
        {offer.subtitle && <p className="admin-offer-card__desc">{offer.subtitle}</p>}

        {/* Placement info */}
        <div className="admin-offer-card__placement-info">
          <div className="admin-offer-card__placement-row">
            <FiMapPin />
            <span><strong>{pageLabel}</strong> → {sectionLabel}</span>
          </div>
          <div className="admin-offer-card__placement-row">
            <span className="admin-offer-card__position-badge">#{offer.placement?.position ?? 1}</span>
            <span>Display Order</span>
          </div>
        </div>

        {/* Dates */}
        {offer.validity?.to && (
          <div className="admin-offer-card__date-row">
            <FiCalendar />
            <span>
              {new Date(offer.validity.from).toLocaleDateString()} — {new Date(offer.validity.to).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Color dots */}
        <div className="admin-offer-card__colors">
          <span className="admin-offer-card__color-dot" style={{ background: bgColor }} title={`BG: ${bgColor}`} />
          <span className="admin-offer-card__color-dot" style={{ background: textColor, border: '1px solid #ddd' }} title={`Text: ${textColor}`} />
        </div>
      </div>

      <div className="admin-offer-card__actions">
        <button className="admin-action-btn admin-action-btn--edit" onClick={() => onEdit(offer)} title="Edit">
          <FiEdit2 />
        </button>
        <button className="admin-action-btn admin-action-btn--delete" onClick={() => onDelete(offer._id || offer.id)} title="Delete">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default OfferCard;
