import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import './CartDrawer.scss';

const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  return (
    <>
      <div className={`cart-overlay ${isCartOpen ? 'cart-overlay--active' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-drawer ${isCartOpen ? 'cart-drawer--open' : ''}`}>
        <div className="cart-drawer__header">
          <h3><FiShoppingBag /> Cart ({cartCount})</h3>
          <button className="cart-drawer__close" onClick={() => setIsCartOpen(false)}>
            <FiX />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-drawer__empty">
            <span className="cart-drawer__empty-icon">🛒</span>
            <p>Your cart is empty</p>
            <button className="cart-drawer__shop-btn" onClick={() => setIsCartOpen(false)}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {cartItems.map(item => (
                <div className="cart-drawer__item" key={item.id}>
                  <img src={item.image} alt={item.name} className="cart-drawer__item-img" />
                  <div className="cart-drawer__item-info">
                    <h4 className="cart-drawer__item-name">{item.name}</h4>
                    <span className="cart-drawer__item-price">₹{item.price.toFixed(2)}</span>
                    <div className="cart-drawer__item-qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><FiMinus /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><FiPlus /></button>
                    </div>
                  </div>
                  <button className="cart-drawer__item-remove" onClick={() => removeFromCart(item.id)}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <span className="cart-drawer__total-amount">₹{cartTotal.toFixed(2)}</span>
              </div>
              <Link to="/cart" className="cart-drawer__checkout-btn" onClick={() => setIsCartOpen(false)}>
                View Cart & Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
