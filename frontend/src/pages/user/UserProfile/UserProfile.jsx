import { FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiHeart, FiEdit } from 'react-icons/fi';
import { mockUser } from '../../../mock/users';
import { products } from '../../../mock/products';
import { orders } from '../../../mock/orders';
import ProductCard from '../../../components/ProductCard/ProductCard';
import './UserProfile.scss';

const UserProfile = () => {
  const userOrders = orders.filter(o => mockUser.orderHistory.includes(o.id));
  const wishlistItems = products.filter(p => mockUser.wishlist.includes(p.id));

  const getStatusColor = (s) => {
    const map = { delivered: 'var(--color-success)', shipped: 'var(--color-primary)', processing: 'var(--color-warning)', pending: 'var(--color-text-muted)', cancelled: 'var(--color-danger)' };
    return map[s] || 'var(--color-text-muted)';
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
          {/* User Info Card */}
          <div className="profile-card">
            <div className="profile-card__avatar">
              <FiUser />
            </div>
            <h2 className="profile-card__name">{mockUser.name}</h2>
            <div className="profile-card__info">
              <div className="profile-card__row"><FiMail /> {mockUser.email}</div>
              <div className="profile-card__row"><FiPhone /> {mockUser.phone}</div>
              <div className="profile-card__row"><FiMapPin /> {mockUser.address.street}, {mockUser.address.city}, {mockUser.address.state} {mockUser.address.pincode}</div>
            </div>
            <button className="profile-card__edit-btn"><FiEdit /> Edit Profile</button>
          </div>

          {/* Content */}
          <div className="profile-content">
            {/* Orders */}
            <div className="profile-section">
              <h3 className="profile-section__title"><FiPackage /> My Orders</h3>
              {userOrders.length === 0 ? (
                <p className="profile-section__empty">No orders yet</p>
              ) : (
                <div className="profile-orders">
                  {userOrders.map(order => (
                    <div className="profile-order" key={order.id}>
                      <div className="profile-order__header">
                        <span className="profile-order__id">{order.id}</span>
                        <span className="profile-order__status" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                          {order.status}
                        </span>
                      </div>
                      <div className="profile-order__items">
                        {order.items.map((item, i) => (
                          <div className="profile-order__item" key={i}>
                            <img src={item.image} alt={item.name} />
                            <div>
                              <span className="profile-order__item-name">{item.name}</span>
                              <span className="profile-order__item-qty">Qty: {item.quantity} × ${item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="profile-order__footer">
                        <span>Total: <strong>${order.total.toFixed(2)}</strong></span>
                        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <div className="profile-section">
              <h3 className="profile-section__title"><FiHeart /> Wishlist</h3>
              <div className="profile-wishlist">
                {wishlistItems.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
