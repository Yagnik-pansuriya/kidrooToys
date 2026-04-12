import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiHeart, FiEdit, FiPlus, FiTrash2, FiCheck, FiX, FiHome, FiBriefcase, FiStar, FiLock, FiArrowRight } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useGetCustomerProfileQuery } from '../../../store/ActionApi/customerAuthApi';
import { useUpdateCustomerProfileMutation, useChangeCustomerPasswordMutation, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation } from '../../../store/ActionApi/customerApi';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useToast } from '../../../context/ToastContext';
import { updateCustomerProfile } from '../../../store/ReducerApi/customerAuthSlice';
import Loader from '../../../components/Loader/Loader';
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

  const customer = profileResp?.data || profileResp || null;

  // Local state
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddressApi(addressId).unwrap();
      showSuccess('Address deleted');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete address');
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
              <button className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => navigate('/wishlist')}>
                <FiHeart /> Wishlist
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
                        <div className="address-card__header">
                          <span className="address-card__label">
                            {getLabelIcon(addr.label)} {addr.label?.toUpperCase() || 'HOME'}
                          </span>
                          {addr.isDefault && <span className="address-card__default-badge"><FiCheck /> Default</span>}
                        </div>
                        <p className="address-card__name">{addr.fullName}</p>
                        <p className="address-card__address">
                          {[addr.houseNo, addr.street, addr.landmark].filter(Boolean).join(', ')}
                          <br />
                          {addr.city}, {addr.state} - {addr.zipCode}
                        </p>
                        <p className="address-card__phone"><FiPhone /> {addr.phone}</p>
                        <div className="address-card__actions">
                          <button onClick={() => openEditAddress(addr)}><FiEdit /> Edit</button>
                          <button onClick={() => handleDeleteAddress(addr._id)}><FiTrash2 /> Delete</button>
                          {!addr.isDefault && <button onClick={() => handleSetDefault(addr._id)}><FiCheck /> Set Default</button>}
                        </div>
                      </div>
                    ))}
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

                  {showPasswordForm && (
                    <form className="password-form" onSubmit={handleChangePassword}>
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                      <input
                        type="password"
                        placeholder="New Password (min 6 chars)"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        minLength={6}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                      />
                      <div className="password-form__actions">
                        <button type="submit" className="btn-primary" disabled={changingPassword}>
                          {changingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                        <button type="button" className="btn-outline" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
