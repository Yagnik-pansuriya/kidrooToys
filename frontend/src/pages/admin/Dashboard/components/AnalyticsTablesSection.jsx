import React, { useState } from 'react';
import { FiUser, FiPackage, FiHeart, FiStar, FiShoppingBag, FiAward } from 'react-icons/fi';

const AnalyticsTablesSection = ({ topBuyers = [], topProducts = [], mostLikedProducts = [] }) => {
  const [activeTab, setActiveTab] = useState('buyers'); // 'buyers' | 'products' | 'liked'

  return (
    <div className="analytics-section">
      <div className="analytics-section__header">
        <div className="analytics-section__title-group">
          <h2 className="analytics-section__title">
            Executive Analytics & Management Reports 📋
          </h2>
          <p className="analytics-section__subtitle">
            Detailed performance breakdown of customers, sales, and product engagement
          </p>
        </div>

        <div className="analytics-section__tabs">
          <button
            className={`tab-btn ${activeTab === 'buyers' ? 'active' : ''}`}
            onClick={() => setActiveTab('buyers')}
          >
            <FiUser /> Top Buyers
          </button>
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FiPackage /> Top Best Sellers
          </button>
          <button
            className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            <FiHeart /> Most Liked & Wishlisted
          </button>
        </div>
      </div>

      {/* TAB 1: TOP BUYERS */}
      {activeTab === 'buyers' && (
        <div className="table-container fade-in">
          <div className="table-container__header">
            <h3><FiAward style={{ color: '#f59e0b' }} /> Top Buyers Ranking</h3>
            <span className="badge">{topBuyers.length} Top Customers</span>
          </div>

          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Total Orders</th>
                <th>Total Spend</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {topBuyers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-td">No customer purchase data available for this timeframe.</td>
                </tr>
              ) : (
                topBuyers.map((b, idx) => (
                  <tr key={b._id || idx}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {b.avatar ? (
                            <img src={b.avatar} alt={b.firstName} />
                          ) : (
                            <span>{b.firstName?.charAt(0) || 'C'}</span>
                          )}
                        </div>
                        <div>
                          <span className="name">{b.firstName} {b.lastName}</span>
                          <span className="sub font-mono">ID: {String(b.customerId || '').slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div>{b.email || 'N/A'}</div>
                        <div className="sub">{b.mobile || ''}</div>
                      </div>
                    </td>
                    <td>
                      <span className="pill pill-indigo">{b.totalOrders} Orders</span>
                    </td>
                    <td>
                      <strong className="amount">₹{(b.totalSpent || 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="date-text">
                        {b.lastOrderDate ? new Date(b.lastOrderDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: TOP PRODUCTS */}
      {activeTab === 'products' && (
        <div className="table-container fade-in">
          <div className="table-container__header">
            <h3><FiShoppingBag style={{ color: '#10b981' }} /> Best Selling Products</h3>
            <span className="badge">{topProducts.length} Products</span>
          </div>

          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Price</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-td">No product sales data available for this timeframe.</td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <img
                          src={p.image || 'https://via.placeholder.com/48'}
                          alt={p.productName}
                          className="product-img"
                        />
                        <div className="product-info">
                          <span className="name">{p.productName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="price-tag">₹{(p.price || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="pill pill-green">{p.unitsSold} units</span>
                    </td>
                    <td>
                      <strong className="amount">₹{(p.totalRevenue || 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      {p.stock !== undefined ? (
                        <span className={`stock-status ${p.stock > 10 ? 'in-stock' : p.stock > 0 ? 'low-stock' : 'out-stock'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                        </span>
                      ) : (
                        <span className="sub">Active</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: MOST LIKED PRODUCTS */}
      {activeTab === 'liked' && (
        <div className="table-container fade-in">
          <div className="table-container__header">
            <h3><FiHeart style={{ color: '#ec4899' }} /> Most Liked & Wishlisted Toys</h3>
            <span className="badge">{mostLikedProducts.length} Products</span>
          </div>

          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Price</th>
                <th>Wishlist Likes</th>
                <th>Rating</th>
                <th>Reviews Count</th>
              </tr>
            </thead>
            <tbody>
              {mostLikedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-td">No product rating/like data available.</td>
                </tr>
              ) : (
                mostLikedProducts.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <img
                          src={p.image || 'https://via.placeholder.com/48'}
                          alt={p.productName}
                          className="product-img"
                        />
                        <div className="product-info">
                          <span className="name">{p.productName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="price-tag">₹{(p.price || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div className="likes-cell">
                        <FiHeart className="heart-icon" />
                        <strong>{p.likesCount || 0}</strong> wishlist saves
                      </div>
                    </td>
                    <td>
                      <div className="rating-cell">
                        <FiStar className="star-icon" />
                        <strong>{p.ratings ? p.ratings.toFixed(1) : '4.5'}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="pill pill-pink">{p.numReviews || 0} Reviews</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTablesSection;
