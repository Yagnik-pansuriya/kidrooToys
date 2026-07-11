import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiHeart, FiEdit, FiPlus, FiTrash2, FiCheck, FiX, FiHome, FiBriefcase, FiStar, FiLock, FiArrowRight, FiShoppingCart, FiEye, FiEyeOff, FiTruck } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useGetCustomerProfileQuery } from '../../../store/ActionApi/customerAuthApi';
import { useUpdateCustomerProfileMutation, useChangeCustomerPasswordMutation, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation, useGetWishlistQuery, useToggleWishlistMutation, useClearWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useGetMyOrdersQuery, useGetMyOrderByIdQuery } from '../../../store/ActionApi/orderApi';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useToast } from '../../../context/ToastContext';
import { updateCustomerProfile, toggleWishlistId, setWishlistIds } from '../../../store/ReducerApi/customerAuthSlice';
import { useCart } from '../../../context/CartContext';
import Loader from '../../../components/Loader/Loader';
import SEOHead from '../../../components/SEOHead/SEOHead';
import UserConfirmModal from '../../../components/ConfirmModal/UserConfirmModal';
import './UserProfile.scss';

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: <FiHome /> },
  { value: 'work', label: 'Work', icon: <FiBriefcase /> },
  { value: 'other', label: 'Other', icon: <FiMapPin /> },
];

const emptyAddress = {
  label: 'home',
  fullName: '',
  phone: '',
  houseNo: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  isDefault: false,
};

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCustomerAuthenticated, openAuthModal } = useCustomerAuth();
  const { showSuccess, showError } = useToast();

  // API hooks
  const { data: profileResp, isLoading } = useGetCustomerProfileQuery(undefined, {
    skip: !isCustomerAuthenticated,
  });
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateCustomerProfileMutation();
  const [changePasswordApi, { isLoading: changingPassword }] = useChangeCustomerPasswordMutation();
  const [addAddressApi] = useAddAddressMutation();
  const [updateAddressApi] = useUpdateAddressMutation();
  const [deleteAddressApi] = useDeleteAddressMutation();
  const [setDefaultApi] = useSetDefaultAddressMutation();
  const [toggleWishlistApi] = useToggleWishlistMutation();
  const [clearWishlistApi] = useClearWishlistMutation();
  const { addToCart } = useCart();

  // Wishlist API - only fetch when wishlist tab is active
  const [wishlistTabActive, setWishlistTabActive] = useState(false);
  const { data: wishlistResp, isLoading: wishlistLoading } = useGetWishlistQuery(undefined, {
    skip: !isCustomerAuthenticated || !wishlistTabActive,
  });
  const wishlistItems = wishlistResp?.data || wishlistResp || [];

  // Orders API
  const [ordersTabActive, setOrdersTabActive] = useState(false);
  const { data: ordersResp, isLoading: ordersLoading } = useGetMyOrdersQuery(undefined, {
    skip: !isCustomerAuthenticated || !ordersTabActive,
  });
  const myOrders = ordersResp?.data || ordersResp || [];

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { data: orderDetailResp, isLoading: orderDetailLoading } = useGetMyOrderByIdQuery(selectedOrderId, {
    skip: !selectedOrderId,
  });
  const orderDetail = orderDetailResp?.data?.order || orderDetailResp?.data || null;
  const trackingData = orderDetailResp?.data?.tracking || null;

  const customer = profileResp?.data || profileResp || null;

  // Local state
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // Show/hide toggles for each password field
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  // Address delete confirmation modal
  const [deleteAddrId, setDeleteAddrId] = useState(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', email: '', alternatePhone: '',
  });

  // Address form
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  // ── Not logged in ────────────────────────────────────────────
  if (!isCustomerAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-page__hero"><div className="container"><h1>My Profile</h1></div></div>
        <div className="container">
          <div className="profile-page__login-prompt">
            <div className="profile-page__login-icon">👤</div>
            <h3>Please Login to View Your Profile</h3>
            <p>Access your orders, addresses, and wishlist</p>
            <button className="profile-page__login-btn" onClick={() => openAuthModal()}>
              Login / Sign Up <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader message="Loading profile..." />;
  if (!customer) return <div className="profile-page"><div className="container"><p>Unable to load profile</p></div></div>;

  // ── Edit profile ─────────────────────────────────────────────
  const startEdit = () => {
    setProfileForm({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      alternatePhone: customer.alternatePhone || '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(profileForm).unwrap();
      dispatch(updateCustomerProfile(result?.data || profileForm));
      showSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update profile');
    }
  };

  // ── Change password ──────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    try {
      await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      showSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to change password');
    }
  };

  // ── Address management ───────────────────────────────────────
  const openAddAddress = () => {
    if ((customer.addresses || []).length >= 5) {
      showError('You can add a maximum of 5 addresses');
      return;
    }
    setAddressForm({ ...emptyAddress });
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (addr) => {
    setAddressForm({
      label: addr.label || 'home',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      houseNo: addr.houseNo || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'India',
      isDefault: addr.isDefault || false,
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await updateAddressApi({ addressId: editingAddressId, ...addressForm }).unwrap();
        showSuccess('Address updated');
      } else {
        await addAddressApi(addressForm).unwrap();
        showSuccess('Address added');
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddressApi(addressId).unwrap();
      showSuccess('Address deleted');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete address');
    } finally {
      setDeleteAddrId(null);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultApi(addressId).unwrap();
      showSuccess('Default address updated');
    } catch (err) {
      showError(err?.data?.message || 'Failed to update default');
    }
  };

  const addresses = customer.addresses || [];

  // ── Get label icon ───────────────────────────────────────────
  const getLabelIcon = (label) => {
    const type = ADDRESS_TYPES.find(t => t.value === label);
    return type?.icon || <FiMapPin />;
  };

  return (
    <div className="profile-page">
      <SEOHead title="My Profile" description="Manage your Kidroo Toys account profile, addresses, and settings." noIndex={true} />
      <div className="profile-page__hero">
        <div className="container">
          <h1>My Profile</h1>
        </div>
      </div>

      <div className="container">
        <div className="profile-layout">
          {/* ── Sidebar ── */}
          <div className="profile-card">
            <div className="profile-card__avatar">
              <FiUser />
            </div>
            <h2 className="profile-card__name">{customer.firstName} {customer.lastName}</h2>
            <div className="profile-card__info">
              <div className="profile-card__row"><FiPhone /> +91 {customer.mobile}</div>
              {customer.email && <div className="profile-card__row"><FiMail /> {customer.email}</div>}
              {customer.alternatePhone && <div className="profile-card__row"><FiPhone /> {customer.alternatePhone}</div>}
            </div>

            <div className="profile-card__tabs">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                <FiUser /> Profile
              </button>
              <button className={activeTab === 'addresses' ? 'active' : ''} onClick={() => setActiveTab('addresses')}>
                <FiMapPin /> Addresses
              </button>
              <button className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => { setActiveTab('wishlist'); setWishlistTabActive(true); }}>
                <FiHeart /> Wishlist
              </button>
              <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); setOrdersTabActive(true); setSelectedOrderId(null); }}>
                <FiPackage /> Orders
              </button>
              <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
                <FiLock /> Security
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="profile-content">

            {/* TAB: Profile */}
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h3><FiUser /> Personal Information</h3>
                  {!editMode && (
                    <button className="profile-section__edit-btn" onClick={startEdit}>
                      <FiEdit /> Edit
                    </button>
                  )}
                </div>

                {editMode ? (
                  <div className="profile-edit-form">
                    <div className="profile-edit-form__row">
                      <div className="profile-edit-form__field">
                        <label>First Name</label>
                        <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                      </div>
                      <div className="profile-edit-form__field">
                        <label>Last Name</label>
                        <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
                      </div>
                    </div>
                    <div className="profile-edit-form__field">
                      <label>Email</label>
                      <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                    </div>
                    <div className="profile-edit-form__field">
                      <label>Alternate Phone</label>
                      <input type="tel" value={profileForm.alternatePhone} onChange={(e) => setProfileForm({ ...profileForm, alternatePhone: e.target.value })} maxLength={10} />
                    </div>
                    <div className="profile-edit-form__actions">
                      <button className="btn-primary" onClick={handleSaveProfile} disabled={updatingProfile}>
                        {updatingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-details">
                    <div className="profile-details__row">
                      <span className="profile-details__label">Name</span>
                      <span className="profile-details__value">{customer.firstName} {customer.lastName}</span>
                    </div>
                    <div className="profile-details__row">
                      <span className="profile-details__label">Mobile</span>
                      <span className="profile-details__value">+91 {customer.mobile}</span>
                    </div>
                    {customer.email && (
                      <div className="profile-details__row">
                        <span className="profile-details__label">Email</span>
                        <span className="profile-details__value">{customer.email}</span>
                      </div>
                    )}
                    {customer.alternatePhone && (
                      <div className="profile-details__row">
                        <span className="profile-details__label">Alt. Phone</span>
                        <span className="profile-details__value">{customer.alternatePhone}</span>
                      </div>
                    )}
                    <div className="profile-details__row">
                      <span className="profile-details__label">Verified</span>
                      <span className="profile-details__value">
                        {customer.isVerified ? <span className="badge-success"><FiCheck /> Verified</span> : <span className="badge-warning">Pending</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Addresses */}
            {activeTab === 'addresses' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h3><FiMapPin /> My Addresses ({addresses.length}/5)</h3>
                  {addresses.length < 5 && (
                    <button className="profile-section__edit-btn" onClick={openAddAddress}>
                      <FiPlus /> Add Address
                    </button>
                  )}
                </div>

                {/* Address Form */}
                {showAddressForm && (
                  <form className="address-form" onSubmit={handleSaveAddress}>
                    <h4>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>

                    <div className="address-form__types">
                      {ADDRESS_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          className={`address-form__type ${addressForm.label === type.value ? 'active' : ''}`}
                          onClick={() => setAddressForm({ ...addressForm, label: type.value })}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>

                    <div className="address-form__grid">
                      <div className="address-form__field">
                        <label>Full Name *</label>
                        <input required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>Phone *</label>
                        <input required type="tel" maxLength={10} value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>House/Flat No.</label>
                        <input value={addressForm.houseNo} onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>Street/Area *</label>
                        <input required value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>Landmark</label>
                        <input value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>City *</label>
                        <input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>State *</label>
                        <input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                      </div>
                      <div className="address-form__field">
                        <label>ZIP Code *</label>
                        <input required maxLength={6} value={addressForm.zipCode} onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })} />
                      </div>
                    </div>

                    <label className="address-form__checkbox">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                      <span>Set as default address</span>
                    </label>

                    <div className="address-form__actions">
                      <button type="submit" className="btn-primary">Save Address</button>
                      <button type="button" className="btn-outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Address List */}
                {addresses.length === 0 && !showAddressForm ? (
                  <div className="profile-section__empty">
                    <p>No addresses saved yet. Add your first address!</p>
                  </div>
                ) : (
                  <div className="address-list">
                    {addresses.map((addr) => (
                      <div className={`address-card ${addr.isDefault ? 'address-card--default' : ''}`} key={addr._id}>
                        {/* Card Header */}
                        <div className="address-card__header">
                          <span className="address-card__label">
                            {getLabelIcon(addr.label)} {addr.label?.toUpperCase() || 'HOME'}
                          </span>
                          {addr.isDefault && (
                            <span className="address-card__default-badge"><FiCheck /> Default</span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="address-card__body">
                          <p className="address-card__name">{addr.fullName}</p>
                          <p className="address-card__address">
                            {[addr.houseNo, addr.street, addr.landmark].filter(Boolean).join(', ')}<br />
                            {addr.city}, {addr.state} — {addr.zipCode}
                          </p>
                          <span className="address-card__phone"><FiPhone /> {addr.phone}</span>
                        </div>

                        {/* Action Bar */}
                        <div className="address-card__actions">
                          <button className="btn-edit" onClick={() => openEditAddress(addr)}>
                            <FiEdit /> Edit
                          </button>
                          <button className="btn-delete" onClick={() => setDeleteAddrId(addr._id)}>
                            <FiTrash2 /> Delete
                          </button>
                          {!addr.isDefault && (
                            <button className="btn-default" onClick={() => handleSetDefault(addr._id)}>
                              <FiCheck /> Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h3><FiHeart /> My Wishlist</h3>
                  {wishlistItems.length > 0 && (
                    <button className="profile-section__edit-btn" style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                      onClick={async () => {
                        try {
                          await clearWishlistApi().unwrap();
                          dispatch(setWishlistIds([]));
                          showSuccess('Wishlist cleared');
                        } catch { showError('Failed to clear wishlist'); }
                      }}
                    >
                      <FiTrash2 /> Clear All
                    </button>
                  )}
                </div>

                {wishlistLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading wishlist…</div>
                ) : wishlistItems.length === 0 ? (
                  <div className="profile-section__empty">
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💝</div>
                    <p>Your wishlist is empty.</p>
                    <Link to="/shop" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Browse Shop →</Link>
                  </div>
                ) : (
                  <div className="profile-wishlist-grid">
                    {wishlistItems.map((product) => {
                      const name = product.productName || product.name || 'Product';
                      const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                      const price = Number(product.price || 0);
                      const originalPrice = Number(product.originalPrice || 0);
                      const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
                      const productId = product._id || product.id;
                      const inStock = product.stock > 0;
                      return (
                        <div className="profile-wishlist-card" key={productId}>
                          <Link to={`/product/${product.slug || productId}`} className="profile-wishlist-card__img">
                            {imgSrc ? <img src={imgSrc} alt={name} loading="lazy" /> : <div className="profile-wishlist-card__placeholder">📦</div>}
                            {discount > 0 && <span className="profile-wishlist-card__badge">-{discount}%</span>}
                          </Link>
                          <div className="profile-wishlist-card__info">
                            <Link to={`/product/${product.slug || productId}`} className="profile-wishlist-card__name">{name}</Link>
                            <div className="profile-wishlist-card__price">
                              <span>₹{price.toFixed(0)}</span>
                              {originalPrice > price && <span className="profile-wishlist-card__original">₹{originalPrice.toFixed(0)}</span>}
                            </div>
                            <div className="profile-wishlist-card__actions">
                              <button
                                className="profile-wishlist-card__cart"
                                disabled={!inStock}
                                onClick={() => { addToCart(product); showSuccess(`${name} added to cart!`); }}
                              >
                                <FiShoppingCart /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                              </button>
                              <button
                                className="profile-wishlist-card__remove"
                                title="Remove"
                                onClick={async () => {
                                  try {
                                    await toggleWishlistApi(productId).unwrap();
                                    dispatch(toggleWishlistId(productId));
                                    showSuccess('Removed from wishlist');
                                  } catch { showError('Failed to remove'); }
                                }}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Security */}
            {activeTab === 'security' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h3><FiLock /> Security</h3>
                </div>

                <div className="security-section">
                  <div className="security-item">
                    <div>
                      <h4>Change Password</h4>
                      <p>Update your password to keep your account secure</p>
                    </div>
                    {!showPasswordForm && (
                      <button className="btn-outline" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordForm && (() => {
                    const pwd = passwordForm.newPassword;
                    const rules = [
                      { label: 'At least 8 characters', ok: pwd.length >= 8 },
                      { label: 'One uppercase letter', ok: /[A-Z]/.test(pwd) },
                      { label: 'One digit (0–9)', ok: /\d/.test(pwd) },
                      { label: 'One special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(pwd) },
                    ];
                    const pwdValid = rules.every(r => r.ok);
                    const allFilled = passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword;
                    const matched = passwordForm.newPassword === passwordForm.confirmPassword;

                    return (
                      <form className="password-form" onSubmit={handleChangePassword}>
                        {/* Current Password */}
                        <div className="password-form__field">
                          <input
                            type={showPwd.current ? 'text' : 'password'}
                            placeholder="Current Password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                          />
                          <button type="button" className="password-form__eye" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}>
                            {showPwd.current ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>

                        {/* New Password */}
                        <div className="password-form__field">
                          <input
                            type={showPwd.newPwd ? 'text' : 'password'}
                            placeholder="New Password (min 8 chars)"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            minLength={8}
                            required
                          />
                          <button type="button" className="password-form__eye" onClick={() => setShowPwd(p => ({ ...p, newPwd: !p.newPwd }))}>
                            {showPwd.newPwd ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>

                        {/* Strength checklist */}
                        {passwordForm.newPassword && (
                          <ul className="password-form__rules">
                            {rules.map(r => (
                              <li key={r.label} className={r.ok ? 'ok' : ''}>
                                {r.ok ? <FiCheck /> : <FiX />} {r.label}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Confirm Password */}
                        <div className="password-form__field">
                          <input
                            type={showPwd.confirm ? 'text' : 'password'}
                            placeholder="Confirm New Password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                          <button type="button" className="password-form__eye" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}>
                            {showPwd.confirm ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>

                        {/* Mismatch warning */}
                        {passwordForm.confirmPassword && !matched && (
                          <p className="password-form__mismatch">Passwords do not match</p>
                        )}

                        <div className="password-form__actions">
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={changingPassword || !pwdValid || !allFilled || !matched}
                          >
                            {changingPassword ? 'Changing...' : 'Change Password'}
                          </button>
                          <button type="button" className="btn-outline" onClick={() => { setShowPasswordForm(false); setShowPwd({ current: false, newPwd: false, confirm: false }); }}>Cancel</button>
                        </div>
                      </form>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB: Orders */}
            {activeTab === 'orders' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h3>
                    <FiPackage /> {selectedOrderId ? `Order Details: ${orderDetail?.orderId || ''}` : 'My Order History'}
                  </h3>
                  {selectedOrderId && (
                    <button className="profile-section__edit-btn" onClick={() => setSelectedOrderId(null)}>
                      <FiArrowRight style={{ transform: 'rotate(180deg)', marginRight: '6px' }} /> Back to Orders
                    </button>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="profile-section__loader" style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Loader message="Loading orders..." />
                  </div>
                ) : !selectedOrderId ? (
                  myOrders.length === 0 ? (
                    <div className="orders-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div className="orders-empty-state__icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
                      <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-header)' }}>No Orders Placed Yet</h4>
                      <p style={{ color: '#6B6E7E', marginBottom: '24px' }}>Browse our exciting toys and check out to see your orders here!</p>
                      <Link to="/shop" className="btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>Shop Now</Link>
                    </div>
                  ) : (
                    <div className="orders-list">
                      <div className="orders-list__header-row">
                        <span>Order ID</span>
                        <span>Date</span>
                        <span>Total</span>
                        <span>Status</span>
                        <span>Action</span>
                      </div>
                      {myOrders.map(order => (
                        <div className="orders-list__row" key={order._id}>
                          <span className="orders-list__id">{order.orderId}</span>
                          <span className="orders-list__date">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="orders-list__amount">₹{(order.netAmount || 0).toFixed(2)}</span>
                          <span>
                            <span className={`status-badge status-badge--${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </span>
                          <span>
                            <button className="orders-list__view-btn" onClick={() => setSelectedOrderId(order._id)}>
                              <FiEye /> View Details
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ) : orderDetailLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Loader message="Loading order details..." />
                  </div>
                ) : !orderDetail ? (
                  <p>Order details could not be found.</p>
                ) : (
                  <div className="order-detail-view">
                    <div className="order-detail-grid">
                      {/* Left Info Panel */}
                      <div className="order-detail-left">
                        <div className="order-detail-card">
                          <h4>Items Ordered</h4>
                          <div className="order-detail-items">
                            {orderDetail.items.map((item, idx) => (
                              <div className="order-detail-item" key={item._id || idx}>
                                <img src={item.image || 'placeholder.jpg'} alt={item.productName} />
                                <div className="order-detail-item__info">
                                  <h5>{item.productName}</h5>
                                  {item.skuCode && <span className="order-detail-item__sku">SKU: {item.skuCode}</span>}
                                  <span className="order-detail-item__qty">Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}</span>
                                </div>
                                <span className="order-detail-item__total">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tracking Section */}
                        <div className="order-detail-card order-detail-card--tracking">
                          <h4>Live Parcel Tracking</h4>
                          {orderDetail.shiprocketAwbNumber ? (
                            <div className="tracking-section">
                              <div className="tracking-meta">
                                <div><strong>Courier:</strong> {orderDetail.shiprocketCourierCompany || 'Shiprocket'}</div>
                                <div><strong>AWB Number:</strong> {orderDetail.shiprocketAwbNumber}</div>
                                {orderDetail.shiprocketStatus && (
                                  <div><strong>Status:</strong> <span className="status-badge status-badge--confirmed">{orderDetail.shiprocketStatus}</span></div>
                                )}
                              </div>

                              {/* Progress bar */}
                              {trackingData?.history ? (
                                <div className="tracking-timeline">
                                  {trackingData.history.map((step, idx) => (
                                    <div key={idx} className={`tracking-step ${step.done ? 'tracking-step--done' : ''}`}>
                                      <div className="tracking-step__dot">
                                        {step.done ? <FiCheck /> : null}
                                      </div>
                                      <div className="tracking-step__content">
                                        <div className="tracking-step__title">{step.status}</div>
                                        {step.activity && <div className="tracking-step__desc">{step.activity}</div>}
                                        {step.date && (
                                          <div className="tracking-step__time">
                                            {new Date(step.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="tracking-pending">Tracking details are being updated by courier partner. Check back shortly.</p>
                              )}
                            </div>
                          ) : (
                            <div className="tracking-pending-box">
                              <FiTruck className="tracking-pending-icon" />
                              <p>Order is pending confirmation. Courier live tracking starts once shipment is booked.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Summary Panel */}
                      <div className="order-detail-right">
                        <div className="order-detail-card">
                          <h4>Shipping Address</h4>
                          <p className="address-text">
                            <strong>{orderDetail.shippingAddress.fullName}</strong><br />
                            {orderDetail.shippingAddress.houseNo && `${orderDetail.shippingAddress.houseNo}, `}
                            {orderDetail.shippingAddress.street}<br />
                            {orderDetail.shippingAddress.landmark && `Landmark: ${orderDetail.shippingAddress.landmark}`}
                            {orderDetail.shippingAddress.landmark && <br />}
                            {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} - {orderDetail.shippingAddress.zipCode}<br />
                            <strong>Phone:</strong> {orderDetail.shippingAddress.phone}
                          </p>
                        </div>

                        <div className="order-detail-card">
                          <h4>Payment Information</h4>
                          <p className="payment-text">
                            <strong>Method:</strong> {orderDetail.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}<br />
                            <strong>Payment Status:</strong> <span className={`status-badge status-badge--${orderDetail.paymentStatus.toLowerCase()}`}>{orderDetail.paymentStatus}</span>
                          </p>
                        </div>

                        <div className="order-detail-card">
                          <h4>Bill Summary</h4>
                          <div className="bill-summary-row">
                            <span>Subtotal</span>
                            <span>₹{(orderDetail.totalItemsPrice || 0).toFixed(2)}</span>
                          </div>
                          <div className="bill-summary-row">
                            <span>Shipping charges</span>
                            <span>₹{(orderDetail.shippingCharges || 0).toFixed(2)}</span>
                          </div>
                          {(orderDetail.couponDiscount || 0) > 0 && (
                            <div className="bill-summary-row bill-summary-row--discount">
                              <span>Discount ({orderDetail.couponCode})</span>
                              <span>-₹{(orderDetail.couponDiscount || 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="bill-summary-divider" />
                          <div className="bill-summary-row bill-summary-row--total">
                            <span>Total Paid</span>
                            <span>₹{(orderDetail.netAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Invoice download link */}
                        {orderDetail.shiprocketInvoiceUrl && (
                          <a
                            href={orderDetail.shiprocketInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline order-detail-invoice-btn"
                          >
                            <FiPackage /> Download Official Invoice (PDF)
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Delete Confirmation Modal */}
      <UserConfirmModal
        isOpen={!!deleteAddrId}
        title="Delete Address?"
        message="Are you sure you want to remove this address? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => handleDeleteAddress(deleteAddrId)}
        onClose={() => setDeleteAddrId(null)}
      />
    </div>
  );
};

export default UserProfile;
