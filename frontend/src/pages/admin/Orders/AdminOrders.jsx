import { useState } from 'react';
import { FiEye, FiX, FiSearch, FiPackage, FiLoader } from 'react-icons/fi';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '../../../store/ActionApi/orderApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './AdminOrders.scss';

const AdminOrders = () => {
  const { showSuccess, showError } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: ordersData, isLoading, refetch } = useGetAllOrdersQuery({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchQuery || undefined,
  });
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const orders = ordersData?.data || [];

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ id: orderId, orderStatus: newStatus }).unwrap();
      showSuccess(`Order status updated to "${newStatus}"`);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
      }
    } catch (err) {
      showError(err?.data?.message || 'Failed to update order status');
    }
  };

  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  const getPaymentBadge = (method) => {
    if (method === 'online') return <span className="badge badge--online">💳 Razorpay</span>;
    return <span className="badge badge--cod">🚚 COD</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const classes = {
      pending: 'badge--warning',
      paid: 'badge--success',
      failed: 'badge--danger',
      refunded: 'badge--info',
    };
    return <span className={`badge ${classes[status] || ''}`}>{status}</span>;
  };

  const getOrderStatusBadge = (status) => {
    const classes = {
      pending: 'badge--warning',
      confirmed: 'badge--success',
      processing: 'badge--info',
      shipped: 'badge--primary',
      delivered: 'badge--success',
      cancelled: 'badge--danger',
    };
    return <span className={`badge ${classes[status] || ''}`}>{status}</span>;
  };

  if (isLoading) return <Loader inline message="Loading Orders…" />;

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Orders 📦</h1>
        <div className="admin-orders__search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by Order ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-orders__filters">
        {statuses.map(s => (
          <button
            key={s}
            className={`admin-filter-btn ${filterStatus === s ? 'admin-filter-btn--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="admin-orders__empty">
          <FiPackage />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="admin-orders__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="td-bold">{order.orderId}</td>
                  <td>
                    {order.customerId?.firstName
                      ? `${order.customerId.firstName} ${order.customerId.lastName || ''}`
                      : order.shippingAddress?.fullName || 'N/A'}
                  </td>
                  <td>{order.products?.length || 0} item(s)</td>
                  <td className="td-bold">₹{order.totalAmount?.toFixed(2)}</td>
                  <td>
                    <div className="td-badges">
                      {getPaymentBadge(order.paymentMethod)}
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </td>
                  <td>
                    <select
                      className={`status-select status-select--${order.orderStatus}`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={isUpdating}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button className="admin-action-btn admin-action-btn--edit" onClick={() => setSelectedOrder(order)}>
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Order {selectedOrder.orderId}</h2>
              <button onClick={() => setSelectedOrder(null)}><FiX /></button>
            </div>
            <div className="order-detail">
              {/* Order Status & Payment Info */}
              <div className="order-detail__info-bar">
                <div>
                  <span className="order-detail__label">Order Status</span>
                  {getOrderStatusBadge(selectedOrder.orderStatus)}
                </div>
                <div>
                  <span className="order-detail__label">Payment Method</span>
                  {getPaymentBadge(selectedOrder.paymentMethod)}
                </div>
                <div>
                  <span className="order-detail__label">Payment Status</span>
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                <div>
                  <span className="order-detail__label">Date</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Razorpay Details (if online payment) */}
              {selectedOrder.paymentMethod === 'online' && selectedOrder.razorpayPaymentId && (
                <div className="order-detail__section order-detail__section--razorpay">
                  <h4>💳 Razorpay Payment Details</h4>
                  <div className="order-detail__grid">
                    <div><span className="order-detail__label">Razorpay Order ID</span><p>{selectedOrder.razorpayOrderId}</p></div>
                    <div><span className="order-detail__label">Payment ID</span><p>{selectedOrder.razorpayPaymentId}</p></div>
                    {selectedOrder.paidAt && (
                      <div><span className="order-detail__label">Paid At</span><p>{new Date(selectedOrder.paidAt).toLocaleString('en-IN')}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="order-detail__section">
                <h4>👤 Customer Info</h4>
                <p>
                  <strong>
                    {selectedOrder.customerId?.firstName
                      ? `${selectedOrder.customerId.firstName} ${selectedOrder.customerId.lastName || ''}`
                      : 'N/A'}
                  </strong>
                </p>
                {selectedOrder.customerId?.email && <p>📧 {selectedOrder.customerId.email}</p>}
                {selectedOrder.customerId?.mobile && <p>📱 {selectedOrder.customerId.mobile}</p>}
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="order-detail__section">
                  <h4>📍 Shipping Address</h4>
                  <p><strong>{selectedOrder.shippingAddress.fullName}</strong></p>
                  <p>{selectedOrder.shippingAddress.houseNo && `${selectedOrder.shippingAddress.houseNo}, `}{selectedOrder.shippingAddress.street}</p>
                  {selectedOrder.shippingAddress.landmark && <p><em>{selectedOrder.shippingAddress.landmark}</em></p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}</p>
                  <p>📱 {selectedOrder.shippingAddress.phone}</p>
                </div>
              )}

              {/* Items */}
              <div className="order-detail__section">
                <h4>📦 Items</h4>
                {selectedOrder.products?.map((item, i) => (
                  <div className="order-detail__item" key={i}>
                    <img src={item.productImage} alt={item.productName} />
                    <div>
                      <span className="order-detail__item-name">{item.productName}</span>
                      {item.variantName && <span className="order-detail__item-variant">{item.variantName}</span>}
                      <span className="order-detail__item-qty">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</span>
                    </div>
                    <span className="order-detail__item-total">₹{(item.quantity * item.price)?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="order-detail__summary">
                <div className="order-detail__row"><span>Subtotal</span><span>₹{selectedOrder.subTotal?.toFixed(2)}</span></div>
                <div className="order-detail__row"><span>Shipping</span><span>{selectedOrder.shippingCost === 0 ? 'FREE' : `₹${selectedOrder.shippingCost?.toFixed(2)}`}</span></div>
                {selectedOrder.tax > 0 && <div className="order-detail__row"><span>Tax</span><span>₹{selectedOrder.tax?.toFixed(2)}</span></div>}
                {selectedOrder.discount > 0 && <div className="order-detail__row"><span>Discount</span><span>-₹{selectedOrder.discount?.toFixed(2)}</span></div>}
                <div className="order-detail__row order-detail__row--total"><span>Total</span><span>₹{selectedOrder.totalAmount?.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
