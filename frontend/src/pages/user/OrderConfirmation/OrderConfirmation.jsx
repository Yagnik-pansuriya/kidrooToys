import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { useGetMyOrderByIdQuery } from '../../../store/ActionApi/orderApi';
import Loader from '../../../components/Loader/Loader';
import './OrderConfirmation.scss';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { data: orderData, isLoading, error } = useGetMyOrderByIdQuery(orderId);
  const order = orderData?.data;

  if (isLoading) return <Loader inline message="Loading order details…" />;

  if (error || !order) {
    return (
      <div className="order-confirm">
        <div className="container">
          <div className="order-confirm__error">
            <h2>Order not found</h2>
            <p>We couldn't find this order. It may still be processing.</p>
            <Link to="/" className="order-confirm__btn">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirm">
      <div className="container">
        <div className="order-confirm__card">
          {/* Success Header */}
          <div className="order-confirm__header">
            <div className="order-confirm__icon">
              <FiCheckCircle />
            </div>
            <h1>Order Placed Successfully! 🎉</h1>
            <p className="order-confirm__subtitle">
              Thank you for your order. {order.paymentMethod === 'cod' 
                ? 'Please keep the exact amount ready for delivery.' 
                : 'Your payment has been confirmed.'}
            </p>
          </div>

          {/* Order Info */}
          <div className="order-confirm__info-grid">
            <div className="order-confirm__info-item">
              <span className="order-confirm__info-label">Order ID</span>
              <span className="order-confirm__info-value">{order.orderId}</span>
            </div>
            <div className="order-confirm__info-item">
              <span className="order-confirm__info-label">Payment Method</span>
              <span className="order-confirm__info-value">
                {order.paymentMethod === 'online' ? '💳 Online Payment' : '🚚 Cash on Delivery'}
              </span>
            </div>
            <div className="order-confirm__info-item">
              <span className="order-confirm__info-label">Payment Status</span>
              <span className={`order-confirm__badge order-confirm__badge--${order.paymentStatus}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="order-confirm__info-item">
              <span className="order-confirm__info-label">Order Status</span>
              <span className={`order-confirm__badge order-confirm__badge--${order.orderStatus}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="order-confirm__items">
            <h3><FiPackage /> Items Ordered</h3>
            {order.products?.map((item, i) => (
              <div className="order-confirm__item" key={i}>
                <img src={item.productImage} alt={item.productName} />
                <div className="order-confirm__item-info">
                  <h4>{item.productName}</h4>
                  {item.variantName && <span className="order-confirm__item-variant">{item.variantName}</span>}
                  <span>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</span>
                </div>
                <span className="order-confirm__item-total">₹{(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="order-confirm__summary">
            <div className="order-confirm__summary-row"><span>Subtotal</span><span>₹{order.subTotal?.toFixed(2)}</span></div>
            <div className="order-confirm__summary-row"><span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost?.toFixed(2)}`}</span></div>
            {order.discount > 0 && (
              <div className="order-confirm__summary-row"><span>Discount</span><span>-₹{order.discount?.toFixed(2)}</span></div>
            )}
            <div className="order-confirm__summary-divider" />
            <div className="order-confirm__summary-row order-confirm__summary-row--total">
              <span>Total</span>
              <span>₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="order-confirm__address">
              <h3>📍 Shipping Address</h3>
              <p><strong>{order.shippingAddress.fullName}</strong></p>
              <p>{order.shippingAddress.houseNo && `${order.shippingAddress.houseNo}, `}{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
              <p>📱 {order.shippingAddress.phone}</p>
            </div>
          )}

          {/* Actions */}
          <div className="order-confirm__actions">
            <Link to="/" className="order-confirm__btn order-confirm__btn--primary">
              <FiShoppingBag /> Continue Shopping
            </Link>
            <Link to="/profile" className="order-confirm__btn order-confirm__btn--secondary">
              <FiArrowLeft /> View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
