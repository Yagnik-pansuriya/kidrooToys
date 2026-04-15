import { FiBox, FiShoppingBag, FiDollarSign, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { products } from '../../../mock/products';
import { orders } from '../../../mock/orders';
import './Dashboard.scss';

const Dashboard = () => {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { icon: <FiBox />, label: 'Total Products', value: products.length, color: 'var(--color-primary)' },
    { icon: <FiShoppingBag />, label: 'Total Orders', value: orders.length, color: 'var(--color-primary)' },
    { icon: <FiDollarSign />, label: 'Revenue', value: `₹${totalRevenue.toFixed(0)}`, color: 'var(--color-success)' },
    { icon: <FiUsers />, label: 'Customers', value: '1,250', color: 'var(--color-accent)' },
  ];

  const recentOrders = orders.slice(0, 4);
  
  const getStatusClass = (s) => `status--${s}`;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard 📊</h1>
      
      {/* Stats Cards */}
      <div className="dashboard__stats">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card__icon" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
            <FiTrendingUp className="stat-card__trend" style={{ color: s.color }} />
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="dashboard__section">
        <h2 className="dashboard__section-title">Recent Orders</h2>
        <div className="dashboard__table-wrap">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="td-bold">{order.id}</td>
                  <td>{order.customerName}</td>
                  <td className="td-bold">₹{order.total.toFixed(2)}</td>
                  <td><span className={`status ${getStatusClass(order.status)}`}>{order.status}</span></td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
