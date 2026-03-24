import { useState } from 'react';
import { orders as initialOrders } from '../../../mock/orders';
import { FiEye, FiX } from 'react-icons/fi';
import './AdminOrders.scss';

const AdminOrders = () => {
  const [orderList, setOrderList] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = filterStatus === 'all' ? orderList : orderList.filter(o => o.status === filterStatus);

  const updateStatus = (orderId, newStatus) => {
    setOrderList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
  };

  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Orders 📦</h1>
        <div className="admin-orders__filters">
          {statuses.map(s => (
            <button key={s} className={`admin-filter-btn ${filterStatus === s ? 'admin-filter-btn--active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-orders__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id}>
                <td className="td-bold">{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.items.length} item(s)</td>
                <td className="td-bold">${order.total.toFixed(2)}</td>
                <td>
                  <select className={`status-select status-select--${order.status}`} value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  <button className="admin-action-btn admin-action-btn--edit" onClick={() => setSelectedOrder(order)}><FiEye /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Order {selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)}><FiX /></button>
            </div>
            <div className="order-detail">
              <div className="order-detail__section">
                <h4>Customer Info</h4>
                <p><strong>{selectedOrder.customerName}</strong></p>
                <p>{selectedOrder.email}</p>
                <p>{selectedOrder.phone}</p>
                <p>{selectedOrder.address}</p>
              </div>
              <div className="order-detail__section">
                <h4>Items</h4>
                {selectedOrder.items.map((item, i) => (
                  <div className="order-detail__item" key={i}>
                    <img src={item.image} alt={item.name} />
                    <div>
                      <span className="order-detail__item-name">{item.name}</span>
                      <span className="order-detail__item-qty">Qty: {item.quantity} × ${item.price}</span>
                    </div>
                    <span className="order-detail__item-total">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>

                  
                ))}
              </div>
              <div className="order-detail__summary">
                <div className="order-detail__row"><span>Subtotal</span><span>${selectedOrder.subtotal.toFixed(2)}</span></div>
                <div className="order-detail__row"><span>Shipping</span><span>${selectedOrder.shipping.toFixed(2)}</span></div>
                <div className="order-detail__row"><span>Discount</span><span>-${selectedOrder.discount.toFixed(2)}</span></div>
                <div className="order-detail__row order-detail__row--total"><span>Total</span><span>${selectedOrder.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
