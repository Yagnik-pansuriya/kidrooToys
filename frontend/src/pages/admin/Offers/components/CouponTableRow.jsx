import React from 'react';
import { FiTag, FiEdit2, FiTrash2 } from 'react-icons/fi';

const CouponTableRow = ({ coupon, onEdit, onDelete, onToggleStatus }) => {
  const isExpired = coupon.validTo && new Date(coupon.validTo) < new Date();
  
  const getStatusBadge = () => {
    if (isExpired) return <span className="badge badge-expired">Expired</span>;
    if (coupon.isActive) return <span className="badge badge-active">Active</span>;
    return <span className="badge badge-inactive">Inactive</span>;
  };

  const discountText = coupon.discountType === 'percentage' 
    ? `${coupon.discountValue}%` 
    : `₹${coupon.discountValue}`;

  return (
    <tr>
      <td>
        <div className="offer-name-cell">
          <div className="offer-icon-box">
            <FiTag />
          </div>
          <div>
            <div className="offer-name">{coupon.code}</div>
            <div className="offer-type-tag">{coupon.description || 'Coupon Code'}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="badge badge-coupon">Coupon</span>
      </td>
      <td>
        <strong>{discountText}</strong>
      </td>
      <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '140px' }}>
        {coupon.visibility === 'public' ? 'Public' : 'Private'}
      </td>
      <td style={{ fontSize: '13px' }}>
        {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString() : 'No expiry'}
      </td>
      <td>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>
          {(coupon.usedCount ?? coupon.usageCount ?? 0)} / {coupon.usageLimit || '∞'}
        </div>
        {coupon.usageLimit > 0 && (
          <div className="mini-progress">
            <div className="mini-progress-fill" style={{ width: `${Math.min((((coupon.usedCount ?? coupon.usageCount ?? 0)) / coupon.usageLimit) * 100, 100)}%` }}></div>
          </div>
        )}
      </td>
      <td>
        <div className="toggle-wrap">
          <button 
            className={`toggle ${coupon.isActive ? 'on' : ''}`} 
            onClick={() => onToggleStatus(coupon)} 
            aria-label="Toggle coupon"
          />
          {getStatusBadge()}
        </div>
      </td>
      <td>
        <div className="action-btns">
          <button className="icon-btn" onClick={() => onEdit(coupon)} title="Edit" aria-label="Edit"><FiEdit2 /></button>
          <button className="icon-btn icon-btn--danger" onClick={() => onDelete(coupon._id || coupon.id)} title="Delete" aria-label="Delete"><FiTrash2 /></button>
        </div>
      </td>
    </tr>
  );
};

export default CouponTableRow;
