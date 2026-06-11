import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import { initialCouponForm } from '../constants/offerConstants';
import { useGetProductsQuery } from '../../../../store/ActionApi/productApi';

const todayStr = () => new Date().toISOString().split('T')[0];
const monthLaterStr = () => {
  const d = new Date(); d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

const CouponFormModal = ({ isOpen, onClose, onSubmit, editingCoupon, isSubmitting }) => {
  const [form, setForm] = useState(initialCouponForm);
  const [productSearch, setProductSearch] = useState('');

  const { data: productsResp } = useGetProductsQuery(
    { page: 1, limit: 50, search: productSearch, isActive: 'true' },
    { skip: !isOpen }
  );
  const productsInner = productsResp?.data || productsResp;
  const productList = Array.isArray(productsInner?.data) ? productsInner.data
    : Array.isArray(productsInner) ? productsInner : [];

  useEffect(() => {
    if (isOpen) {
      if (editingCoupon) {
        setForm({
          code: editingCoupon.code || '',
          description: editingCoupon.description || '',
          discountType: editingCoupon.discountType || 'percentage',
          discountValue: editingCoupon.discountValue ?? '',
          minOrderAmount: editingCoupon.minOrderAmount ?? '',
          maxDiscount: editingCoupon.maxDiscount ?? '',
          minQuantity: editingCoupon.minQuantity ?? '',
          isSpecificProduct: (editingCoupon.applicableProducts || []).length > 0,
          applicableProducts: (editingCoupon.applicableProducts || []).map(p =>
            typeof p === 'object' ? (p._id || p.id) : p
          ),
          validFrom: editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().split('T')[0] : todayStr(),
          validTo: editingCoupon.validTo ? new Date(editingCoupon.validTo).toISOString().split('T')[0] : monthLaterStr(),
          usageLimit: editingCoupon.usageLimit ?? 100,
          perUserLimit: editingCoupon.perUserLimit ?? 1,
          isActive: editingCoupon.isActive !== undefined ? editingCoupon.isActive : true,
          visibility: editingCoupon.visibility || 'public',
        });
      } else {
        setForm({ ...initialCouponForm, validFrom: todayStr(), validTo: monthLaterStr() });
      }
    }
  }, [isOpen, editingCoupon]);

  const toggleProduct = (productId) => {
    setForm(p => ({
      ...p,
      applicableProducts: p.applicableProducts.includes(productId)
        ? p.applicableProducts.filter(id => id !== productId)
        : [...p.applicableProducts, productId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
          <button onClick={onClose}><FiX /></button>
        </div>
        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            {/* Code & Visibility */}
            <div className="admin-field">
              <label>Coupon Code *</label>
              <input type="text" value={form.code} placeholder="e.g. SUMMER20"
                onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required
                style={{ textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }} />
            </div>
            <div className="admin-field">
              <label>Visibility</label>
              <div className="coupon-visibility-toggle">
                <button type="button"
                  className={`coupon-vis-btn ${form.visibility === 'public' ? 'coupon-vis-btn--active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, visibility: 'public' }))}>
                  🌐 Public
                </button>
                <button type="button"
                  className={`coupon-vis-btn ${form.visibility === 'private' ? 'coupon-vis-btn--active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, visibility: 'private' }))}>
                  🔒 Private
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="admin-field admin-field--full">
              <label>Description *</label>
              <textarea value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} required
                placeholder="e.g. Get 20% off on all summer toys!" />
            </div>

            {/* Discount Type & Value */}
            <div className="admin-field">
              <label>Discount Type *</label>
              <select value={form.discountType}
                onChange={(e) => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Discount Value *</label>
              <input type="number" min="0" value={form.discountValue}
                onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))} required
                placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'} />
            </div>

            {/* Min Order & Max Discount */}
            <div className="admin-field">
              <label>Min Order Amount (₹)</label>
              <input type="number" min="0" value={form.minOrderAmount}
                onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                placeholder="0 = no minimum" />
            </div>
            {form.discountType === 'percentage' && (
              <div className="admin-field">
                <label>Max Discount Cap (₹)</label>
                <input type="number" min="0" value={form.maxDiscount}
                  onChange={(e) => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                  placeholder="No cap" />
              </div>
            )}

            {/* Validity */}
            <div className="admin-field">
              <label>Valid From *</label>
              <input type="date" value={form.validFrom}
                min={todayStr()}
                onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} required />
            </div>
            <div className="admin-field">
              <label>Valid To *</label>
              <input type="date" value={form.validTo}
                min={form.validFrom || todayStr()}
                onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} required />
            </div>

            {/* Usage Limits */}
            <div className="admin-field">
              <label>Total Usage Limit</label>
              <input type="number" min="1" value={form.usageLimit}
                onChange={(e) => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="admin-field">
              <label>Per User Limit</label>
              <input type="number" min="1" value={form.perUserLimit}
                onChange={(e) => setForm(p => ({ ...p, perUserLimit: parseInt(e.target.value) || 1 }))} />
            </div>

            {/* Quantity-Based Discount (BOGO) Rules */}
            <div className="admin-field admin-field--full" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                Quantity-Based Discount Rules (BOGO)
              </h4>
              <div className="admin-form-grid" style={{ marginTop: '4px' }}>
                <div className="admin-field">
                  <label>Minimum Product Quantity</label>
                  <input type="number" min="0" value={form.minQuantity}
                    onChange={(e) => setForm(p => ({ ...p, minQuantity: e.target.value }))}
                    placeholder="e.g. 3 (leave empty or 0 for no limit)" />
                  <span className="admin-field__hint">
                    Requires buying at least this many items to activate the coupon. E.g., Buy 3, get discount.
                  </span>
                </div>
              </div>
            </div>

            {/* Coupon Applicability Scope */}
            <div className="admin-field admin-field--full" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Coupon Scope *</label>
              <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
                <label className="admin-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" name="couponScope" checked={!form.isSpecificProduct}
                    onChange={() => setForm(p => ({ ...p, isSpecificProduct: false, applicableProducts: [] }))} />
                  Any Product (Applies to all products in cart)
                </label>
                <label className="admin-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" name="couponScope" checked={form.isSpecificProduct}
                    onChange={() => setForm(p => ({ ...p, isSpecificProduct: true }))} />
                  Specific Products (Choose from product list)
                </label>
              </div>
            </div>

            {/* Applicable Products (Conditional on Specific Products) */}
            {form.isSpecificProduct && (
              <div className="admin-field admin-field--full">
                <label>Select Applicable Products *</label>
                <div className="coupon-products-section">
                  <div className="coupon-products__search">
                    <FiSearch />
                    <input type="text" placeholder="Search products..." value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)} />
                  </div>
                  {form.applicableProducts.length > 0 && (
                    <div className="coupon-products__selected">
                      <span>{form.applicableProducts.length} product(s) selected</span>
                      <button type="button" className="coupon-products__clear"
                        onClick={() => setForm(p => ({ ...p, applicableProducts: [] }))}>
                        Clear all
                      </button>
                    </div>
                  )}
                  <div className="coupon-products__list">
                    {productList.map(product => {
                      const pid = product._id || product.id;
                      const isSelected = form.applicableProducts.includes(pid);
                      return (
                        <label key={pid} className={`coupon-products__item ${isSelected ? 'coupon-products__item--selected' : ''}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(pid)} />
                          <span className="coupon-products__name">
                            {product.productName || product.name}
                          </span>
                          <span className="coupon-products__price">₹{product.price}</span>
                        </label>
                      );
                    })}
                    {productList.length === 0 && (
                      <p className="coupon-products__empty">No products found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Active */}
            <div className="admin-field">
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
              </label>
            </div>
          </div>

          <div className="admin-modal__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponFormModal;
