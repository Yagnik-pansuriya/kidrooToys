import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar, FiClock,
  FiShoppingCart, FiShoppingBag, FiTrendingUp, FiPackage, FiTag,
  FiAlertCircle, FiExternalLink, FiUser,
} from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import { RiWhatsappLine } from 'react-icons/ri';
import { useGetAdminCartByCustomerQuery } from '../../../store/ActionApi/cartApi';
import Loader from '../../../components/Loader/Loader';
import CartWhatsAppModal from '../../../components/WhatsAppSend/CartWhatsAppModal';
import '../Customers/AdminCustomerDetail.scss';
import './AdminCarts.scss';

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

const stockBadge = (item) => {
  if (item.unavailable) return { cls: 'acart-badge--red', label: 'Unavailable' };
  if (item.stock <= 0) return { cls: 'acart-badge--red', label: 'Out of stock' };
  if (!item.inStock) return { cls: 'acart-badge--amber', label: `Only ${item.stock} left` };
  return { cls: 'acart-badge--green', label: `${item.stock} in stock` };
};

const AdminCartDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('items'); // items | addresses
  const [waOpen, setWaOpen] = useState(false);

  const { data, isLoading } = useGetAdminCartByCustomerQuery(customerId, {
    skip: !customerId,
    refetchOnMountOrArgChange: true,
  });

  const customer = data?.data?.customer;
  const cart = data?.data?.cart || { items: [], totals: {} };
  const orderStats = data?.data?.orderStats || {};
  const items = cart.items || [];
  const totals = cart.totals || {};

  if (isLoading) return <Loader inline message="Loading Cart…" />;

  if (!customer) {
    return (
      <div className="acd-not-found">
        <FiAlertCircle />
        <p>Customer not found</p>
        <button onClick={() => navigate('/admin/carts')}>← Back to Carts</button>
      </div>
    );
  }

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const initials = (customer.firstName?.[0] || 'C').toUpperCase();

  return (
    <div className="acd-page">

      <button className="acd-back-btn" onClick={() => navigate('/admin/carts')}>
        <FiArrowLeft /> Back to Carts
      </button>

      {/* ═══════════ Customer Header ═══════════ */}
      <div className="acd-profile-card">
        <div className="acd-profile-card__left">
          <div className="acd-big-avatar">
            {customer.avatar ? <img src={customer.avatar} alt={fullName} /> : <span>{initials}</span>}
            {customer.isVerified && (
              <span className="acd-verified-ring" title="Verified"><MdVerified /></span>
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
              {customer.email && <span><FiMail /> {customer.email}</span>}
            </div>

            <div className="acd-meta-row">
              <span><FiCalendar /> Joined {fmtDate(customer.createdAt)}</span>
              {customer.lastLogin && <span><FiClock /> Last login {fmtDateTime(customer.lastLogin)}</span>}
              {cart.updatedAt && <span><FiShoppingCart /> Cart updated {fmtDateTime(cart.updatedAt)}</span>}
              {cart.isAbandoned && <span className="acd-unverified-tag">⏳ Abandoned cart</span>}
            </div>
          </div>
        </div>

        <div className="acart-header-actions">
          {items.some((i) => !i.unavailable) && customer.mobile && (
            <button type="button" className="acart-profile-link acart-profile-link--wa" onClick={() => setWaOpen(true)}>
              <RiWhatsappLine /> Send WhatsApp
            </button>
          )}
          <Link to={`/admin/customers/${customer._id}`} className="acart-profile-link">
            <FiUser /> Customer profile
          </Link>
        </div>
      </div>

      {waOpen && (
        <CartWhatsAppModal
          customer={customer}
          items={items}
          subtotal={totals.subtotal}
          onClose={() => setWaOpen(false)}
        />
      )}

      {/* ═══════════ Stats ═══════════ */}
      <div className="acd-stats">
        <div className="acd-stat-card acd-stat-card--indigo">
          <FiShoppingCart />
          <div>
            <span className="acd-stat-val">{totals.itemCount || 0}</span>
            <span className="acd-stat-label">Products in cart</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--purple">
          <FiPackage />
          <div>
            <span className="acd-stat-val">{totals.totalQuantity || 0}</span>
            <span className="acd-stat-label">Total units</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--green">
          <FiTrendingUp />
          <div>
            <span className="acd-stat-val">{fmt(totals.subtotal)}</span>
            <span className="acd-stat-label">Cart value</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--emerald">
          <FiTag />
          <div>
            <span className="acd-stat-val">{fmt(totals.savings)}</span>
            <span className="acd-stat-label">Discount vs MRP</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--amber">
          <FiShoppingBag />
          <div>
            <span className="acd-stat-val">{orderStats.totalOrders || 0}</span>
            <span className="acd-stat-label">Past orders</span>
          </div>
        </div>
        <div className="acd-stat-card acd-stat-card--red">
          <FiTrendingUp />
          <div>
            <span className="acd-stat-val">{fmt(orderStats.totalSpent)}</span>
            <span className="acd-stat-label">Lifetime spent</span>
          </div>
        </div>
      </div>

      {/* ═══════════ Tabs ═══════════ */}
      <div className="acd-tabs">
        {[
          { key: 'items',     label: `Cart Items (${items.length})`,                 icon: <FiShoppingCart /> },
          { key: 'addresses', label: `Addresses (${customer.addresses?.length || 0})`, icon: <FiMapPin /> },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`acd-tab ${activeTab === tab.key ? 'acd-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Cart Items Tab */}
      {activeTab === 'items' && (
        <div className="acd-section">
          {items.length === 0 ? (
            <div className="acd-empty">
              <FiShoppingCart />
              <p>This customer&apos;s cart is empty</p>
            </div>
          ) : (
            <>
              <div className="acart-items">
                {items.map((item) => {
                  const sb = stockBadge(item);
                  const p = item.product || {};
                  const v = item.variant;
                  const discount = item.originalPrice > item.price
                    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                    : 0;
                  return (
                    <div key={item.id} className={`acart-item ${item.unavailable ? 'acart-item--unavailable' : ''}`}>
                      <div className="acart-item__img">
                        {item.image ? <img src={item.image} alt={item.name} /> : <FiPackage />}
                      </div>

                      <div className="acart-item__info">
                        <div className="acart-item__title">
                          <h3>{item.name}</h3>
                          {item.slug && (
                            <a href={`/product/${item.slug}`} target="_blank" rel="noreferrer" title="Open product page">
                              <FiExternalLink />
                            </a>
                          )}
                        </div>

                        <div className="acart-item__specs">
                          {p.productCode && <span><b>Code:</b> {p.productCode}</span>}
                          {(v?.sku || p.skuCode) && <span><b>SKU:</b> {v?.sku || p.skuCode}</span>}
                          {p.categories?.length > 0 && (
                            <span><b>Category:</b> {p.categories.map((c) => c.catagoryName).join(', ')}</span>
                          )}
                          {p.ageRange?.length > 0 && <span><b>Age:</b> {p.ageRange.join(', ')}</span>}
                        </div>

                        {v && Object.keys(v.attributes || {}).length > 0 && (
                          <div className="acart-item__attrs">
                            {Object.entries(v.attributes).map(([k, val]) => (
                              <span key={k} className="acart-chip">{k}: {val}</span>
                            ))}
                          </div>
                        )}

                        <div className="acart-item__meta">
                          <span className={`acart-badge ${sb.cls}`}>{sb.label}</span>
                          <span className="acart-item__added">Added {fmtDateTime(item.addedAt)}</span>
                        </div>
                      </div>

                      <div className="acart-item__pricing">
                        <div className="acart-item__price">
                          {fmt(item.price)}
                          {discount > 0 && <span className="acart-item__mrp">{fmt(item.originalPrice)}</span>}
                          {discount > 0 && <span className="acart-item__off">{discount}% off</span>}
                        </div>
                        <div className="acart-item__qty">Qty: <b>{item.quantity}</b></div>
                        <div className="acart-item__total">{fmt(item.lineTotal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="acart-totals">
                <div><span>MRP total</span><strong>{fmt(totals.mrpTotal)}</strong></div>
                <div><span>Discount</span><strong className="acart-totals__save">-{fmt(totals.savings)}</strong></div>
                <div className="acart-totals__grand"><span>Cart subtotal</span><strong>{fmt(totals.subtotal)}</strong></div>
                <p className="acart-totals__note">
                  Prices are current catalogue prices; unavailable items are excluded. Shipping and coupons apply at checkout.
                </p>
              </div>
            </>
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
                    {addr.isDefault && <span className="acd-default-badge">Default</span>}
                  </div>
                  <p className="acd-addr-name">{addr.fullName}</p>
                  <p className="acd-addr-line">{addr.houseNo && `${addr.houseNo}, `}{addr.street}</p>
                  {addr.landmark && <p className="acd-addr-landmark">Near: {addr.landmark}</p>}
                  <p className="acd-addr-line">{addr.city}, {addr.state} — {addr.zipCode}</p>
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

export default AdminCartDetail;
