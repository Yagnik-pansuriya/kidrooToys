import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiCheck, FiTag, FiFileText, FiGlobe, FiLock, FiPercent, FiDollarSign, FiCalendar, FiUser, FiPackage, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
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
      if (!form.discountValue || form.discountValue <= 0) errs.discountValue = 'Valid discount value is required';
      if (!form.validFrom) errs.validFrom = 'Start date is required';
      if (!form.validTo) errs.validTo = 'End date is required';
    }
    if (modalStep === 3) {
      if (form.isSpecificProduct && form.applicableProducts.length === 0) {
        errs.applicableProducts = 'Please select at least one product';
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
      <div className="offer-modal premium-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon">🎟️</div>
            <div>
              <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <p>Configure promo codes, discount values, and customer usage limits</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="modal-stepper-bar">
          <div className={`stepper-step ${modalStep >= 1 ? 'active' : ''} ${modalStep > 1 ? 'completed' : ''}`} onClick={() => modalStep > 1 && setModalStep(1)}>
            <div className="step-circle">{modalStep > 1 ? <FiCheck /> : 1}</div>
            <span className="step-text">Basic Details</span>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${modalStep >= 2 ? 'active' : ''} ${modalStep > 2 ? 'completed' : ''}`} onClick={() => modalStep > 2 && setModalStep(2)}>
            <div className="step-circle">{modalStep > 2 ? <FiCheck /> : 2}</div>
            <span className="step-text">Rules & Limits</span>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${modalStep === 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-text">Scope & Save</span>
          </div>
        </div>

        <div className="modal-body">
          <form id="couponForm" onSubmit={handleSubmit}>
            
            {/* STEP 1: Basic Details */}
            {modalStep === 1 && (
              <div className="step-content">
                <div className="section-title-badge">COUPON IDENTITY</div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiTag className="icon-inline" /> Coupon Code <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <input 
                      type="text" 
                      value={form.code} 
                      placeholder="e.g. WELCOME20"
                      onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className="coupon-code-input"
                    />
                    <span className="code-badge-hint">AUTO-CAPS</span>
                  </div>
                  {errors.code && <span className="form-error-msg">{errors.code}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiFileText className="icon-inline" /> Description <span className="req">*</span>
                  </label>
                  <textarea 
                    value={form.description} 
                    rows={3} 
                    placeholder="e.g. Get 20% flat discount on all wooden educational toys during summer sale!"
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} 
                  />
                  {errors.description && <span className="form-error-msg">{errors.description}</span>}
                </div>

                <div className="section-title-badge" style={{ marginTop: '24px' }}>VISIBILITY & PERMISSIONS</div>
                
                <div className="card-selector-grid">
                  <div 
                    className={`selector-card ${form.visibility === 'public' ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, visibility: 'public' }))}
                  >
                    <div className="selector-card-icon blue-bg"><FiGlobe /></div>
                    <div className="selector-card-info">
                      <div className="selector-card-title">Public Coupon</div>
                      <div className="selector-card-sub">Visible to all shoppers on cart & offers page</div>
                    </div>
                    {form.visibility === 'public' && <div className="card-check-badge"><FiCheck /></div>}
                  </div>

                  <div 
                    className={`selector-card ${form.visibility === 'private' ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, visibility: 'private' }))}
                  >
                    <div className="selector-card-icon amber-bg"><FiLock /></div>
                    <div className="selector-card-info">
                      <div className="selector-card-title">Private Code</div>
                      <div className="selector-card-sub">Hidden from site. Requires manual code entry</div>
                    </div>
                    {form.visibility === 'private' && <div className="card-check-badge"><FiCheck /></div>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Rules & Limits */}
            {modalStep === 2 && (
              <div className="step-content">
                <div className="section-title-badge">DISCOUNT CONFIGURATION</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Type <span className="req">*</span></label>
                    <div className="custom-select-wrap">
                      <select value={form.discountType} onChange={(e) => setForm(p => ({ ...p, discountType: e.target.value }))}>
                        <option value="percentage">Percentage (%) Discount</option>
                        <option value="fixed">Fixed Amount (₹) Off</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Discount Value ({form.discountType === 'percentage' ? '%' : '₹'}) <span className="req">*</span>
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.discountValue}
                      onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))}
                      placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 250'} 
                    />
                    {errors.discountValue && <span className="form-error-msg">{errors.discountValue}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Order Amount (₹)</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.minOrderAmount}
                      onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} 
                      placeholder="0 = No minimum required" 
                    />
                  </div>

                  {form.discountType === 'percentage' && (
                    <div className="form-group">
                      <label className="form-label">Max Discount Cap (₹)</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={form.maxDiscount}
                        onChange={(e) => setForm(p => ({ ...p, maxDiscount: e.target.value }))} 
                        placeholder="Leave blank for no cap" 
                      />
                    </div>
                  )}
                </div>

                <div className="section-title-badge" style={{ marginTop: '24px' }}>VALIDITY DATES & USAGE LIMITS</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><FiCalendar className="icon-inline" /> Valid From <span className="req">*</span></label>
                    <input 
                      type="date" 
                      value={form.validFrom} 
                      min={todayStr()}
                      onChange={(e) => setForm(p => ({ ...p, validFrom: e.target.value }))} 
                    />
                    {errors.validFrom && <span className="form-error-msg">{errors.validFrom}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label"><FiCalendar className="icon-inline" /> Valid Until <span className="req">*</span></label>
                    <input 
                      type="date" 
                      value={form.validTo} 
                      min={form.validFrom || todayStr()}
                      onChange={(e) => setForm(p => ({ ...p, validTo: e.target.value }))} 
                    />
                    {errors.validTo && <span className="form-error-msg">{errors.validTo}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><FiUser className="icon-inline" /> Total Global Redemptions</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={form.usageLimit}
                      onChange={(e) => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) || 1 }))} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><FiUser className="icon-inline" /> Redemptions Per Customer</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={form.perUserLimit}
                      onChange={(e) => setForm(p => ({ ...p, perUserLimit: parseInt(e.target.value) || 1 }))} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Applicability */}
            {modalStep === 3 && (
              <div className="step-content">
                <div className="section-title-badge">PRODUCT APPLICABILITY SCOPE</div>
                
                <div className="card-selector-grid">
                  <div 
                    className={`selector-card ${!form.isSpecificProduct ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, isSpecificProduct: false, applicableProducts: [] }))}
                  >
                    <div className="selector-card-icon green-bg"><FiPackage /></div>
                    <div className="selector-card-info">
                      <div className="selector-card-title">Entire Store</div>
                      <div className="selector-card-sub">Applies to all active catalog products</div>
                    </div>
                    {!form.isSpecificProduct && <div className="card-check-badge"><FiCheck /></div>}
                  </div>

                  <div 
                    className={`selector-card ${form.isSpecificProduct ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, isSpecificProduct: true }))}
                  >
                    <div className="selector-card-icon purple-bg"><FiTag /></div>
                    <div className="selector-card-info">
                      <div className="selector-card-title">Specific Products</div>
                      <div className="selector-card-sub">Restricted to chosen products only</div>
                    </div>
                    {form.isSpecificProduct && <div className="card-check-badge"><FiCheck /></div>}
                  </div>
                </div>

                {form.isSpecificProduct && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Select Products</label>
                    <div className="product-search-box">
                      <FiSearch className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search products by name..." 
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    {errors.applicableProducts && <span className="form-error-msg">{errors.applicableProducts}</span>}
                    
                    <div className="product-select-list">
                      {productList.map(product => {
                        const pid = product._id || product.id;
                        const isSelected = form.applicableProducts.includes(pid);
                        return (
                          <div key={pid} className={`product-select-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleProduct(pid)}>
                            <input type="checkbox" checked={isSelected} readOnly />
                            <span className="product-name">{product.productName || product.name}</span>
                            <span className="product-price">₹{product.price}</span>
                          </div>
                        );
                      })}
                      {productList.length === 0 && (
                        <div className="empty-products-notice">No matching products found</div>
                      )}
                    </div>
                    {form.applicableProducts.length > 0 && (
                      <div className="selected-count-pill">
                        ✓ {form.applicableProducts.length} product(s) selected
                      </div>
                    )}
                  </div>
                )}

                <div className="section-title-badge" style={{ marginTop: '24px' }}>STATUS & CONFIRMATION</div>
                
                <label className="toggle-switch-row">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} 
                  />
                  <div className="toggle-slider"></div>
                  <span className="toggle-label">Activate coupon immediately upon saving</span>
                </label>

                {/* Summary Ticket Card */}
                <div className="summary-ticket-card">
                  <div className="ticket-header">
                    <span className="ticket-code-pill">{form.code || 'COUPONCODE'}</span>
                    <span className="ticket-type-badge">
                      {form.discountType === 'percentage' ? `${form.discountValue}% OFF` : `₹${form.discountValue} OFF`}
                    </span>
                  </div>
                  <div className="ticket-body">
                    <div>Valid: <strong>{form.validFrom}</strong> to <strong>{form.validTo}</strong></div>
                    <div>Scope: <strong>{form.isSpecificProduct ? `${form.applicableProducts.length} Products` : 'All Products'}</strong></div>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>
        
        {/* Footer Bar */}
        <div className="modal-footer">
          {modalStep > 1 && (
            <button className="btn btn-outline" type="button" onClick={prevStep}>
              <FiArrowLeft /> Back
            </button>
          )}
          {modalStep < 3 ? (
            <button className="btn btn-primary btn-pills" type="button" onClick={nextStep}>
              Next Step <FiArrowRight />
            </button>
          ) : (
            <button className="btn btn-primary btn-pills" type="submit" form="couponForm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Coupon...' : '✓ Save & Launch Coupon'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponFormModal;
