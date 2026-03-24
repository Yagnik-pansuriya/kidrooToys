import React from 'react';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { offerTypes } from '../constants/offerConstants';

const OfferCard = ({ offer, onPreview, onEdit, onDelete }) => {
  return (
    <div className="admin-offer-card">
      <div className="admin-offer-card__header">
        <div>
          <span className={`admin-offer-card__type admin-offer-card__type--${offer.type}`}>
            {offerTypes.find(t => t.value === offer.type)?.label || offer.type}
          </span>
          <span className={`admin-offer-card__status ${offer.isActive ? 'admin-offer-card__status--active' : ''}`}>
            {offer.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="admin-actions">
          <button className="admin-action-btn admin-action-btn--edit" onClick={() => onPreview(offer)} title="Preview"><FiEye /></button>
          <button className="admin-action-btn admin-action-btn--edit" onClick={() => onEdit(offer)} title="Edit"><FiEdit2 /></button>
          <button className="admin-action-btn admin-action-btn--delete" onClick={() => onDelete(offer._id || offer.id)} title="Delete"><FiTrash2 /></button>
        </div>
      </div>
      <h3 className="admin-offer-card__title">{offer.title}</h3>
      <p className="admin-offer-card__desc">{offer.subtitle}</p>
      <div className="admin-offer-card__meta">
        {offer.discountPercentage > 0 && <span className="admin-offer-card__discount">{offer.discountPercentage}% OFF</span>}
        {offer.couponCode && <span className="admin-offer-card__coupon">{offer.couponCode}</span>}
        {offer.validity?.to && <span className="admin-offer-card__date">Until: {new Date(offer.validity.to).toLocaleDateString()}</span>}
      </div>
      <div className="admin-offer-card__colors">
        <span style={{ background: offer.bgColor }} />
        <span style={{ background: offer.textColor, border: '1px solid #ddd' }} />
      </div>
    </div>
  );
};

export default OfferCard;
