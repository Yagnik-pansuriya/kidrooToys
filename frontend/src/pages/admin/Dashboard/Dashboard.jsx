import { FiBox, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { products } from '../../../mock/products';
import './Dashboard.scss';

const Dashboard = () => {
  const stats = [
    { icon: <FiBox />, label: 'Total Products', value: products.length, color: 'var(--color-primary)' },
    { icon: <FiUsers />, label: 'Customers', value: '1,250', color: 'var(--color-accent)' },
  ];

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
    </div>
  );
};

export default Dashboard;
