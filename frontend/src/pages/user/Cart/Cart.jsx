import { FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import './Cart.scss';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { requireAuth } = useCustomerAuth();
  const navigate = useNavigate();
  const shipping = cartTotal >= 500 ? 0 : 50;
  const total = cartTotal + shipping;

  const handleCheckout = () => {
    if (!requireAuth('Please login to proceed to checkout', () => navigate('/checkout'))) return;
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-page__hero">
          <div className="container"><h1>Shopping Cart</h1></div>
        </div>
        <div className="container">
          <div className="cart-empty">
            <span className="cart-empty__icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any toys yet!</p>
            <Link to="/" className="cart-empty__btn"><FiArrowLeft /> Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__hero">
        <div className="container"><h1><FiShoppingBag /> Shopping Cart</h1></div>
      </div>
      <div className="container">
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-items__header">
              <span>{cartItems.length} item(s) in your cart</span>
              <button className="cart-items__clear" onClick={clearCart}>Clear All</button>
            </div>
            {cartItems.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-item__img" />
                <div className="cart-item__info">
                  <h4 className="cart-item__name">{item.name}</h4>
                  {item.variantName && (
                    <span className="cart-item__variant">{item.variantName}</span>
                  )}
                  <span className="cart-item__price">₹{item.price.toFixed(2)}</span>
                </div>
                <div className="cart-item__qty">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><FiMinus /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><FiPlus /></button>
                </div>
                <span className="cart-item__subtotal">₹{(item.price * item.quantity).toFixed(2)}</span>
                <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3 className="cart-summary__title">Order Summary</h3>
            <div className="cart-summary__row"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
            <div className="cart-summary__row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
            <div className="cart-summary__divider" />
            <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            {cartTotal < 500 && <p className="cart-summary__note">Add ₹{(500 - cartTotal).toFixed(2)} more for free shipping!</p>}
            <button className="cart-summary__checkout" onClick={handleCheckout}>Proceed to Checkout</button>
            <Link to="/" className="cart-summary__continue"><FiArrowLeft /> Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
