import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin,
  FiShoppingBag, FiTrendingUp, FiCalendar, FiPackage,
  FiToggleRight, FiToggleLeft, FiClock, FiCheckCircle,
  FiXCircle, FiTruck, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { MdVerified, MdBlock } from 'react-icons/md';
import { useGetAdminCustomerByIdQuery, useToggleAdminCustomerStatusMutation } from '../../../store/ActionApi/adminCustomerApi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './AdminCustomerDetail.scss';

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// ── Order status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { icon: <FiClock />,        className: 'acd-badge--warning',  label: 'Pending' },
  confirmed:  { icon: <FiCheckCircle />,  className: 'acd-badge--success',  label: 'Confirmed' },
  processing: { icon: <FiLoader />,       className: 'acd-badge--info',     label: 'Processing' },
  shipped:    { icon: <FiTruck />,        className: 'acd-badge--primary',  label: 'Shipped' },
  delivered:  { icon: <FiCheckCircle />,  className: 'acd-badge--success',  label: 'Delivered' },
  cancelled:  { icon: <FiXCircle />,      className: 'acd-badge--danger',   label: 'Cancelled' },
};

const PAYMENT_STATUS = {
  pending:  'acd-badge--warning',
  paid:     'acd-badge--success',
  failed:   'acd-badge--danger',
  refunded: 'acd-badge--info',
};

const AdminCustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // orders | addresses | wishlist

  const { data, isLoading } = useGetAdminCustomerByIdQuery(id, {
    skip: !id,
  });

  const [toggleStatus, { isLoading: isToggling }] = useToggleAdminCustomerStatusMutation();

  const customer = data?.data?.customer;
  const orders   = data?.data?.orders   || [];
  const stats    = data?.data?.stats    || {};

  const handleToggleStatus = async () => {
    try {
      const res = await toggleStatus(id).unwrap();
      showSuccess(res.message || 'Status updated');
    } catch (err) {
      showError(err?.data?.message || 'Failed to update status');
    }
  };

  if (isLoading) return <Loader inline message="Loading Customer…" />;

  if (!customer) {
    return (
      <div className="acd-not-found">
        <FiAlertCircle />
        <p>Customer not found</p>
        <button onClick={() => navigate('/admin/customers')}>← Back to Customers</button>
      </div>
    );
  }

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const initials = (customer.firstName?.[0] || 'C').toUpperCase();

  return (
    <div className="acd-page">

      {/* ── Back button ── */}
      <button className="acd-back-btn" onClick={() => navigate('/admin/customers')}>
        <FiArrowLeft /> Back to Customers
      </button>

      {/* ═══════════ Profile Header ═══════════ */}
      <div className="acd-profile-card">
        <div className="acd-profile-card__left">
          <div className="acd-big-avatar">
            {customer.avatar
              ? <img src={customer.avatar} alt={fullName} />
              : <span>{initials}</span>
            }
            {customer.isVerified && (
              <span className="acd-verified-ring" title="Verified">
                <MdVerified />
              </span>
            )}
          </div>

          <div className="acd-profile-card__info">
            <h1 className="acd-name">
              {fullName}
              <span className={`acd-status-pill ${customer.isActive ? 'acd-status-pill--active' : 'acd-status-pill--inactive'}`}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </h1>

            <div className="acd-contact-row">
              <span><FiPhone /> +91 {customer.mobile}</span>
              {customer.alternatePhone && (
                <span><FiPhone /> +91 {customer.alternatePhone} <em>(Alt)</em></span>
              )}
              {customer.email && (
                <span><FiMail /> {customer.email}</span>
              )}
            </div>

            <div className="acd-meta-row">
              <span><FiCalendar /> Joined {fmtDate(customer.createdAt)}</span>
              {customer.lastLogin && (
                <span><FiClock /> Last login {fmtDateTime(customer.lastLogin)}</span>
              )}
              {!customer.isVerified && (
                <span className="acd-unverified-tag">⚠️ Not Verified</span>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Status Button */}
        <button
          className={`acd-toggle-btn ${customer.isActive ? 'acd-toggle-btn--deactivate' : 'acd-toggle-btn--activate'}`}
          onClick={handleToggleStatus}
          disabled={isToggling}
          id={`detail-toggle-status-${id}`}
        >
          {customer.isActive ? <><MdBlock /> Deactivate</> : <><FiToggleRight /> Activate</>}
        </button>
      </div>

      {/* ═══════════ Stats Cards ═══════════ */}
      <div className="acd-stats">
        <div className="acd-stat-card acd-stat-card--indigo">
          <FiShoppingBag />
          <div>
            <span className="acd-stat-val">{stats.totalOrders || 0}</span>
            <span className="acd-stat-label">Total Orders</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--green">
          <FiTrendingUp />
          <div>
            <span className="acd-stat-val">{fmt(stats.totalSpent)}</span>
            <span className="acd-stat-label">Total Spent</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--emerald">
          <FiCheckCircle />
          <div>
            <span className="acd-stat-val">{stats.completedOrders || 0}</span>
            <span className="acd-stat-label">Completed Orders</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--amber">
          <FiAlertCircle />
          <div>
            <span className="acd-stat-val">{stats.pendingOrders || 0}</span>
            <span className="acd-stat-label">Pending Orders</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--red">
          <FiXCircle />
          <div>
            <span className="acd-stat-val">{stats.cancelledOrders || 0}</span>
            <span className="acd-stat-label">Cancelled</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--purple">
          <FiTrendingUp />
          <div>
            <span className="acd-stat-val">{fmt(stats.averageOrderValue)}</span>
            <span className="acd-stat-label">Avg. Order Value</span>
          </div>
        </div>
      </div>

      {/* ═══════════ Tabs ═══════════ */}
      <div className="acd-tabs">
        {[
          { key: 'orders',    label: `Orders (${orders.length})`,               icon: <FiShoppingBag /> },
          { key: 'addresses', label: `Addresses (${customer.addresses?.length || 0})`, icon: <FiMapPin /> },
        ].map(tab => (
          <button
            key={tab.key}
            className={`acd-tab ${activeTab === tab.key ? 'acd-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            id={`acd-tab-${tab.key}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ Tab Content ═══════════ */}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="acd-section">
          {orders.length === 0 ? (
            <div className="acd-empty">
              <FiPackage />
              <p>No orders placed yet</p>
            </div>
          ) : (
            <div className="acd-orders-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th>Pay Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const sc = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['pending'];
                    return (
                      <tr key={order._id}>
                        <td>
                          <span className="acd-order-id">{order.orderId}</span>
                        </td>
                        <td className="acd-td-date">{fmtDate(order.createdAt)}</td>
                        <td className="acd-td-center">{order.products?.length || 0}</td>
                        <td>{fmt(order.subTotal)}</td>
                        <td className="acd-td-discount">
                          {order.discount > 0 ? `-${fmt(order.discount)}` : '—'}
                        </td>
                        <td className="acd-td-total">{fmt(order.totalAmount)}</td>
                        <td>
                          <span className={`acd-badge ${order.paymentMethod === 'online' ? 'acd-badge--online' : 'acd-badge--cod'}`}>
                            {order.paymentMethod === 'online' ? '💳 Online' : '🚚 COD'}
                          </span>
                        </td>
                        <td>
                          <span className={`acd-badge ${sc.className}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td>
                          <span className={`acd-badge ${PAYMENT_STATUS[order.paymentStatus] || ''}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Order Summary Footer */}
              <div className="acd-orders-footer">
                <div className="acd-orders-footer__item">
                  <span>Total Orders</span>
                  <strong>{orders.length}</strong>
                </div>
                <div className="acd-orders-footer__item acd-orders-footer__item--spent">
                  <span>Total Spent</span>
                  <strong>{fmt(stats.totalSpent)}</strong>
                </div>
                {stats.totalOrders > 1 && (
                  <div className="acd-orders-footer__repeat">
                    🔁 Repeat Customer
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="acd-section">
          {!customer.addresses?.length ? (
            <div className="acd-empty">
              <FiMapPin />
              <p>No saved addresses</p>
            </div>
          ) : (
            <div className="acd-address-grid">
              {customer.addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`acd-address-card ${addr.isDefault ? 'acd-address-card--default' : ''}`}
                >
                  <div className="acd-address-card__header">
                    <span className="acd-addr-label">
                      {addr.label === 'home' ? '🏠' : addr.label === 'work' ? '💼' : '📍'}
                      {' '}{addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="acd-default-badge">Default</span>
                    )}
                  </div>
                  <p className="acd-addr-name">{addr.fullName}</p>
                  <p className="acd-addr-line">
                    {addr.houseNo && `${addr.houseNo}, `}{addr.street}
                  </p>
                  {addr.landmark && (
                    <p className="acd-addr-landmark">Near: {addr.landmark}</p>
                  )}
                  <p className="acd-addr-line">
                    {addr.city}, {addr.state} — {addr.zipCode}
                  </p>
                  <p className="acd-addr-line">{addr.country}</p>
                  <p className="acd-addr-phone"><FiPhone /> {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerDetail;
