import React from 'react';
import { FiEdit2, FiTrash2, FiCopy, FiEyeOff, FiEye } from 'react-icons/fi';

const CouponCard = ({ coupon, onEdit, onDelete }) => {
  const isExpired = coupon.validTo && new Date(coupon.validTo) < new Date();
  const usagePercent = coupon.usageLimit ? Math.round((coupon.usedCount / coupon.usageLimit) * 100) : 0;

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
  };

  return (
    <div className={`coupon-card ${!coupon.isActive ? 'coupon-card--inactive' : ''} ${isExpired ? 'coupon-card--expired' : ''}`}>
      <div className="coupon-card__header">
        <div className="coupon-card__code-wrap">
          <span className="coupon-card__code">{coupon.code}</span>
          <button className="coupon-card__copy" onClick={copyCode} title="Copy code">
            <FiCopy />
          </button>
        </div>
        <div className="coupon-card__badges">
          <span className={`coupon-card__visibility coupon-card__visibility--${coupon.visibility}`}>
            {coupon.visibility === 'public' ? <><FiEye /> Public</> : <><FiEyeOff /> Private</>}
          </span>
          <span className={`coupon-card__status ${coupon.isActive ? 'coupon-card__status--active' : 'coupon-card__status--inactive'}`}>
            {coupon.isActive ? 'Active' : 'Inactive'}
          </span>
          {isExpired && <span className="coupon-card__status coupon-card__status--expired">Expired</span>}
        </div>
      </div>

      <p className="coupon-card__desc">{coupon.description}</p>

      <div className="coupon-card__discount">
        <span className="coupon-card__discount-value">
          {coupon.discountType === 'percentage'
            ? `${coupon.discountValue}% OFF`
            : `₹${coupon.discountValue} OFF`}
        </span>
        {coupon.minOrderAmount > 0 && (
          <span className="coupon-card__min">Min ₹{coupon.minOrderAmount}</span>
        )}
        {coupon.maxDiscount && coupon.discountType === 'percentage' && (
          <span className="coupon-card__max">Max ₹{coupon.maxDiscount}</span>
        )}
      </div>

      <div className="coupon-card__meta">
        <div className="coupon-card__usage">
          <div className="coupon-card__usage-bar">
            <div className="coupon-card__usage-fill" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
          </div>
          <span className="coupon-card__usage-text">{coupon.usedCount}/{coupon.usageLimit} used</span>
        </div>
        <span className="coupon-card__dates">
          {new Date(coupon.validFrom).toLocaleDateString()} — {new Date(coupon.validTo).toLocaleDateString()}
        </span>
        {coupon.applicableProducts && coupon.applicableProducts.length > 0 && (
          <span className="coupon-card__products">
            {coupon.applicableProducts.length} product{coupon.applicableProducts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="coupon-card__actions">
        <button className="admin-action-btn admin-action-btn--edit" onClick={() => onEdit(coupon)} title="Edit">
          <FiEdit2 />
        </button>
        <button className="admin-action-btn admin-action-btn--delete" onClick={() => onDelete(coupon._id || coupon.id)} title="Delete">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default CouponCard;
