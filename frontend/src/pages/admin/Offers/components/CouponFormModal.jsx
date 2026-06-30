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
  const [modalStep, setModalStep] = useState(1);
  const [errors, setErrors] = useState({});

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
      setModalStep(1);
      setErrors({});
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

  const validateStep = () => {
    const errs = {};
    if (modalStep === 1) {
      if (!form.code.trim()) errs.code = 'Coupon Code is required';
      if (!form.description.trim()) errs.description = 'Description is required';
    }
    if (modalStep === 2) {
      if (!form.discountValue || form.discountValue <= 0) errs.discountValue = 'Valid discount is required';
      if (!form.validFrom) errs.validFrom = 'Start date is required';
      if (!form.validTo) errs.validTo = 'End date is required';
    }
    if (modalStep === 3) {
      if (form.isSpecificProduct && form.applicableProducts.length === 0) {
        errs.applicableProducts = 'Select at least one product';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep() && modalStep < 3) setModalStep(s => s + 1); };
  const prevStep = () => { if (modalStep > 1) setModalStep(s => s - 1); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 1 ? 'var(--primary)' : '#EEE' }}></div>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 2 ? 'var(--primary)' : '#EEE' }}></div>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 3 ? 'var(--primary)' : '#EEE' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Step {modalStep} of 3 — {modalStep === 1 ? 'Basic Details' : modalStep === 2 ? 'Rules & Limits' : 'Applicability & Review'}
          </div>

          <form id="couponForm" onSubmit={handleSubmit}>
            
            {/* STEP 1: Basic Details */}
            <div style={{ display: modalStep === 1 ? 'block' : 'none' }}>
              <div className="section-divider">Coupon Identity</div>
              <div className="form-group">
                <label>Coupon Code *</label>
                <input type="text" value={form.code} placeholder="e.g. SUMMER20"
                  onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  style={{ textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }} />
                {errors.code && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.code}</span>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea value={form.description} rows={2} placeholder="e.g. Get 20% off on all summer toys!"
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                {errors.description && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.description}</span>}
              </div>

              <div className="section-divider">Visibility</div>
              <div className="display-picker">
                <div className={`display-opt ${form.visibility === 'public' ? 'selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, visibility: 'public' }))}>
                  <div className="d-icon">🌐</div>
                  <div>
                    <div className="d-label">Public</div>
                    <div className="d-sub">Visible to everyone</div>
                  </div>
                </div>
                <div className={`display-opt ${form.visibility === 'private' ? 'selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, visibility: 'private' }))}>
                  <div className="d-icon">🔒</div>
                  <div>
                    <div className="d-label">Private</div>
                    <div className="d-sub">Hidden, requires code</div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Rules & Limits */}
            <div style={{ display: modalStep === 2 ? 'block' : 'none' }}>
              <div className="section-divider">Discount Value</div>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Discount Type *</label>
                  <select value={form.discountType} onChange={(e) => setForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Discount Value *</label>
                  <input type="number" min="0" value={form.discountValue}
                    onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'} />
                  {errors.discountValue && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.discountValue}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Min Order Amount (₹)</label>
                  <input type="number" min="0" value={form.minOrderAmount}
                    onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="0 = no min" />
                </div>
                {form.discountType === 'percentage' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Max Discount (₹)</label>
                    <input type="number" min="0" value={form.maxDiscount}
                      onChange={(e) => setForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="No cap" />
                  </div>
                )}
              </div>

              <div className="section-divider">Validity & Limits</div>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Valid From *</label>
                  <input type="date" value={form.validFrom} min={todayStr()}
                    onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} />
                  {errors.validFrom && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.validFrom}</span>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Valid To *</label>
                  <input type="date" value={form.validTo} min={form.validFrom || todayStr()}
                    onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} />
                  {errors.validTo && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.validTo}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Total Uses Limit</label>
                  <input type="number" min="1" value={form.usageLimit}
                    onChange={(e) => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Per User Limit</label>
                  <input type="number" min="1" value={form.perUserLimit}
                    onChange={(e) => setForm(p => ({ ...p, perUserLimit: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
            </div>

            {/* STEP 3: Applicability */}
            <div style={{ display: modalStep === 3 ? 'block' : 'none' }}>
              <div className="section-divider">Coupon Scope</div>
              <div className="display-picker">
                <div className={`display-opt ${!form.isSpecificProduct ? 'selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isSpecificProduct: false, applicableProducts: [] }))}>
                  <div className="d-icon">🛒</div>
                  <div>
                    <div className="d-label">Any Product</div>
                    <div className="d-sub">Applies to all products in cart</div>
                  </div>
                </div>
                <div className={`display-opt ${form.isSpecificProduct ? 'selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isSpecificProduct: true }))}>
                  <div className="d-icon">🎁</div>
                  <div>
                    <div className="d-label">Specific Products</div>
                    <div className="d-sub">Only applies to chosen products</div>
                  </div>
                </div>
              </div>

              {form.isSpecificProduct && (
                <div className="form-group">
                  <label>Select Products</label>
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#888' }} />
                    <input type="text" placeholder="Search..." value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ paddingLeft: '32px' }} />
                  </div>
                  {errors.applicableProducts && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{errors.applicableProducts}</span>}
                  
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '8px', padding: '8px' }}>
                    {productList.map(product => {
                      const pid = product._id || product.id;
                      const isSelected = form.applicableProducts.includes(pid);
                      return (
                        <label key={pid} className="check-row" style={{ padding: '6px', borderRadius: '4px', background: isSelected ? '#FAFAFA' : 'transparent', marginBottom: 0 }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(pid)} />
                          <span style={{ flex: 1 }}>{product.productName || product.name}</span>
                          <span style={{ fontWeight: 700, fontSize: '12px' }}>₹{product.price}</span>
                        </label>
                      );
                    })}
                    {productList.length === 0 && <div style={{ fontSize: '12px', color: '#888', padding: '10px', textAlign: 'center' }}>No products found</div>}
                  </div>
                  {form.applicableProducts.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px' }}>{form.applicableProducts.length} product(s) selected</div>
                  )}
                </div>
              )}

              <div className="section-divider">Options</div>
              <div className="check-row">
                <input type="checkbox" id="chk_active_c" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="chk_active_c">Make coupon active immediately</label>
              </div>

              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: '14px', marginTop: '20px', fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
                ✅ Review your coupon settings. 
                <br/>Code: <strong>{form.code}</strong> - {form.discountType === 'percentage' ? `${form.discountValue}%` : `₹${form.discountValue}`} Off
              </div>
            </div>

          </form>
        </div>
        
        <div className="modal-footer">
          {modalStep > 1 && (
            <button className="btn btn-outline" type="button" onClick={prevStep}>← Back</button>
          )}
          {modalStep < 3 ? (
            <button className="btn btn-primary" type="button" onClick={nextStep}>Next →</button>
          ) : (
            <button className="btn btn-primary" type="submit" form="couponForm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : '✅ Save Coupon'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponFormModal;
