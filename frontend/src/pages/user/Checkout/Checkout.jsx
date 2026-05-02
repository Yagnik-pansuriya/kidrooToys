import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiTruck, FiLoader, FiCheck, FiPackage, FiPlus, FiX, FiEdit2 } from 'react-icons/fi';
import { useCart } from '../../../context/CartContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useGetSettingsQuery } from '../../../store/ActionApi/settingsApi';
import { useGetCustomerProfileQuery } from '../../../store/ActionApi/customerAuthApi';
import { useAddAddressMutation, useSetDefaultAddressMutation } from '../../../store/ActionApi/customerApi';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../../../store/ActionApi/orderApi';
import { useToast } from '../../../context/ToastContext';
import './Checkout.scss';

// Load Razorpay checkout script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Normalize cart item shape
const getItemProps = (item) => ({
  id: item._id || item.id,
  productId: item._id || item.productId || item.id,
  variantId: item.selectedVariant?._id || item.variantId || undefined,
  name: item.productName || item.name || 'Product',
  image: item.selectedVariant?.images?.[0] || (Array.isArray(item.images) ? item.images[0] : item.image) || '',
  price: item.selectedVariant?.price || item.price || 0,
  variantName: item.selectedVariant
    ? Object.values(item.selectedVariant.attributes || {}).join(' / ') || item.selectedVariant.sku || ''
    : (item.variantName || ''),
  quantity: item.quantity || 1,
});

// Empty address template
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
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { isCustomerAuthenticated, customer, requireAuth } = useCustomerAuth();
  const { showSuccess, showError } = useToast();

  const { data: settingsData } = useGetSettingsQuery();
  const { data: profileData, refetch: refetchProfile } = useGetCustomerProfileQuery(undefined, {
    skip: !isCustomerAuthenticated,
  });
  const [addAddressApi, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [setDefaultApi] = useSetDefaultAddressMutation();
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const settings = settingsData?.data;
  const profile = profileData?.data;
  const addresses = profile?.addresses || [];
  const paymentMethods = settings?.paymentMethods || { onlinePayment: true, cashOnDelivery: false };

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...emptyAddress });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);

  const shipping = cartTotal >= 500 ? 0 : 50;
  const total = cartTotal + shipping;
  const normalizedItems = cartItems.map(getItemProps);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isCustomerAuthenticated) {
      requireAuth('Please login to proceed to checkout');
      navigate('/cart');
    }
  }, [isCustomerAuthenticated]);

  // Auto-select default address or first address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr._id);
    }
    // If no addresses exist, auto-open the form
    if (addresses.length === 0 && profile) {
      setShowAddressForm(true);
    }
  }, [addresses, selectedAddressId, profile]);

  // Pre-fill name/phone for new address from customer profile
  useEffect(() => {
    if (customer && !newAddress.fullName) {
      setNewAddress(prev => ({
        ...prev,
        fullName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        phone: customer.mobile || '',
      }));
    }
  }, [customer]);

  // Set default payment method
  useEffect(() => {
    if (paymentMethods.onlinePayment) {
      setPaymentMethod('online');
    } else if (paymentMethods.cashOnDelivery) {
      setPaymentMethod('cod');
    }
  }, [paymentMethods.onlinePayment, paymentMethods.cashOnDelivery]);

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  const handleNewAddressChange = (field, value) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateAddress = (addr) => {
    const required = ['fullName', 'phone', 'street', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!addr[field]?.trim()) {
        showError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }
    if (!/^\d{10}$/.test(addr.phone.replace(/\s/g, ''))) {
      showError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^\d{6}$/.test(addr.zipCode.replace(/\s/g, ''))) {
      showError('Please enter a valid 6-digit PIN code');
      return false;
    }
    return true;
  };

  const handleSaveNewAddress = async () => {
    if (!validateAddress(newAddress)) return;
    try {
      const result = await addAddressApi({
        ...newAddress,
        isDefault: addresses.length === 0, // First address is default
      }).unwrap();
      showSuccess('Address saved!');
      // Refetch profile to get updated addresses
      await refetchProfile();
      // Select the newly added address
      const updated = result.data || result;
      if (Array.isArray(updated) && updated.length > 0) {
        setSelectedAddressId(updated[updated.length - 1]._id);
      }
      setShowAddressForm(false);
      setNewAddress({ ...emptyAddress, fullName: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(), phone: customer?.mobile || '' });
    } catch (err) {
      showError(err?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    // Get the address to ship to
    let shippingAddress;
    if (showAddressForm && addresses.length === 0) {
      // Using inline form (no saved addresses)
      if (!validateAddress(newAddress)) return;
      shippingAddress = newAddress;
    } else if (selectedAddress) {
      shippingAddress = {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        houseNo: selectedAddress.houseNo || '',
        street: selectedAddress.street,
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country || 'India',
      };
    } else {
      showError('Please select or add a shipping address');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        items: normalizedItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
        paymentMethod,
        shippingAddress,
      };

      const result = await createOrder(orderPayload).unwrap();
      const order = result.data?.order || result.data;

      if (paymentMethod === 'online') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showError('Failed to load payment gateway. Please try again.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: result.data?.razorpayKeyId,
          amount: Math.round(total * 100),
          currency: 'INR',
          name: settings?.siteName || 'Kidroo Toys',
          description: `Order ${order.orderId}`,
          order_id: result.data?.razorpayOrderId,
          handler: async (response) => {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              }).unwrap();
              clearCart();
              showSuccess('Payment successful! Order placed.');
              navigate(`/order-confirmation/${order._id}`);
            } catch (err) {
              showError(err?.data?.message || 'Payment verification failed. Please contact support.');
            }
            setIsProcessing(false);
          },
          prefill: {
            name: shippingAddress.fullName,
            email: customer?.email || profile?.email || '',
            contact: shippingAddress.phone,
          },
          theme: {
            color: settings?.themeColors?.primary || '#FF6B35',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              showError('Payment was cancelled.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setIsProcessing(false);
          showError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        });
        rzp.open();
      } else {
        clearCart();
        showSuccess('Order placed successfully! Pay on delivery.');
        navigate(`/order-confirmation/${order._id}`);
        setIsProcessing(false);
      }
    } catch (err) {
      showError(err?.data?.message || 'Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-page__hero">
        <div className="container">
          <Link to="/cart" className="checkout-page__back"><FiArrowLeft /> Back to Cart</Link>
          <h1>Checkout</h1>
        </div>
      </div>

      <div className="container">
        <div className="checkout-layout">
          {/* Left Column */}
          <div className="checkout-main">
            {/* ── Shipping Address ── */}
            <div className="checkout-section">
              <div className="checkout-section__header">
                <h2><FiMapPin /> Shipping Address</h2>
                {addresses.length > 0 && !showAddressForm && (
                  <button className="checkout-section__add-btn" onClick={() => setShowAddressForm(true)}>
                    <FiPlus /> Add New
                  </button>
                )}
              </div>

              {/* Saved Address List */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="address-list">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`address-card ${selectedAddressId === addr._id ? 'address-card--selected' : ''}`}
                      onClick={() => setSelectedAddressId(addr._id)}
                    >
                      <div className="address-card__radio">
                        {selectedAddressId === addr._id ? <FiCheck /> : <span className="address-card__dot" />}
                      </div>
                      <div className="address-card__info">
                        <div className="address-card__top">
                          <strong>{addr.fullName}</strong>
                          <span className="address-card__label">{addr.label}</span>
                          {addr.isDefault && <span className="address-card__default">Default</span>}
                        </div>
                        <p>{addr.houseNo && `${addr.houseNo}, `}{addr.street}</p>
                        {addr.landmark && <p className="address-card__landmark">Near {addr.landmark}</p>}
                        <p>{addr.city}, {addr.state} - {addr.zipCode}</p>
                        <p className="address-card__phone">📱 {addr.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Address Form */}
              {showAddressForm && (
                <div className="address-form-wrap">
                  {addresses.length > 0 && (
                    <button className="address-form-wrap__close" onClick={() => setShowAddressForm(false)}>
                      <FiX /> Cancel
                    </button>
                  )}
                  <div className="checkout-form">
                    {/* Label selector */}
                    <div className="checkout-form__labels">
                      {['home', 'work', 'other'].map(label => (
                        <button
                          key={label}
                          className={`checkout-form__label-btn ${newAddress.label === label ? 'checkout-form__label-btn--active' : ''}`}
                          onClick={() => handleNewAddressChange('label', label)}
                          type="button"
                        >
                          {label === 'home' ? '🏠' : label === 'work' ? '🏢' : '📍'} {label.charAt(0).toUpperCase() + label.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="checkout-form__row">
                      <div className="checkout-form__field">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={newAddress.fullName}
                          onChange={(e) => handleNewAddressChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="checkout-form__field">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => handleNewAddressChange('phone', e.target.value)}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="checkout-form__row">
                      <div className="checkout-form__field checkout-form__field--small">
                        <label>House/Flat No.</label>
                        <input
                          type="text"
                          value={newAddress.houseNo}
                          onChange={(e) => handleNewAddressChange('houseNo', e.target.value)}
                          placeholder="Flat / House No."
                        />
                      </div>
                      <div className="checkout-form__field checkout-form__field--large">
                        <label>Street / Area *</label>
                        <input
                          type="text"
                          value={newAddress.street}
                          onChange={(e) => handleNewAddressChange('street', e.target.value)}
                          placeholder="Street address, area, colony"
                        />
                      </div>
                    </div>

                    <div className="checkout-form__field">
                      <label>Landmark</label>
                      <input
                        type="text"
                        value={newAddress.landmark}
                        onChange={(e) => handleNewAddressChange('landmark', e.target.value)}
                        placeholder="Near school, temple, etc. (optional)"
                      />
                    </div>

                    <div className="checkout-form__row checkout-form__row--three">
                      <div className="checkout-form__field">
                        <label>City *</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => handleNewAddressChange('city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div className="checkout-form__field">
                        <label>State *</label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => handleNewAddressChange('state', e.target.value)}
                          placeholder="State"
                        />
                      </div>
                      <div className="checkout-form__field">
                        <label>PIN Code *</label>
                        <input
                          type="text"
                          value={newAddress.zipCode}
                          onChange={(e) => handleNewAddressChange('zipCode', e.target.value)}
                          placeholder="6-digit PIN"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <button
                      className="checkout-form__save-btn"
                      onClick={handleSaveNewAddress}
                      disabled={isAddingAddress}
                    >
                      {isAddingAddress ? <><FiLoader className="spin" /> Saving...</> : <><FiCheck /> Save Address & Use</>}
                    </button>
                  </div>
                </div>
              )}

              {/* No addresses & form not shown */}
              {addresses.length === 0 && !showAddressForm && (
                <div className="checkout-section__empty">
                  <p>No addresses saved yet.</p>
                  <button className="checkout-section__link" onClick={() => setShowAddressForm(true)}>
                    <FiPlus /> Add Shipping Address
                  </button>
                </div>
              )}
            </div>

            {/* ── Payment Method ── */}
            <div className="checkout-section">
              <h2><FiCreditCard /> Payment Method</h2>
              <div className="payment-options">
                {paymentMethods.onlinePayment && (
                  <div
                    className={`payment-option ${paymentMethod === 'online' ? 'payment-option--selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <div className="payment-option__radio">
                      {paymentMethod === 'online' ? <FiCheck /> : <span />}
                    </div>
                    <div className="payment-option__info">
                      <strong>💳 Online Payment</strong>
                      <p>Pay securely via UPI, Credit/Debit Card, Net Banking, or Wallets</p>
                    </div>
                  </div>
                )}
                {paymentMethods.cashOnDelivery && (
                  <div
                    className={`payment-option ${paymentMethod === 'cod' ? 'payment-option--selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="payment-option__radio">
                      {paymentMethod === 'cod' ? <FiCheck /> : <span />}
                    </div>
                    <div className="payment-option__info">
                      <strong>🚚 Cash on Delivery</strong>
                      <p>Pay with cash when your order arrives at your doorstep</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Order Items ── */}
            <div className="checkout-section">
              <h2><FiPackage /> Order Items ({normalizedItems.length})</h2>
              <div className="checkout-items">
                {normalizedItems.map(item => (
                  <div className="checkout-item" key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="checkout-item__info">
                      <h4>{item.name}</h4>
                      {item.variantName && <span className="checkout-item__variant">{item.variantName}</span>}
                      <span className="checkout-item__qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="checkout-item__price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="order-summary__row">
                <span>Subtotal ({normalizedItems.length} items)</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="order-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="order-summary__free">FREE</span> : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="order-summary__divider" />
              <div className="order-summary__row order-summary__row--total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              {shipping > 0 && cartTotal < 500 && (
                <p className="order-summary__note">Add ₹{(500 - cartTotal).toFixed(2)} more for free shipping!</p>
              )}

              {/* Selected address preview */}
              {selectedAddress && !showAddressForm && (
                <div className="order-summary__address">
                  <span className="order-summary__address-label">📍 Delivering to</span>
                  <p><strong>{selectedAddress.fullName}</strong></p>
                  <p>{selectedAddress.street}, {selectedAddress.city}</p>
                </div>
              )}

              <button
                className="order-summary__btn"
                onClick={handlePlaceOrder}
                disabled={isCreating || isProcessing || (!selectedAddress && !showAddressForm)}
              >
                {isCreating || isProcessing ? (
                  <><FiLoader className="spin" /> Processing...</>
                ) : paymentMethod === 'online' ? (
                  <><FiCreditCard /> Pay ₹{total.toFixed(2)}</>
                ) : (
                  <><FiTruck /> Place Order (COD)</>
                )}
              </button>
              {paymentMethod === 'online' && (
                <p className="order-summary__secure">🔒 Secured by Razorpay</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
