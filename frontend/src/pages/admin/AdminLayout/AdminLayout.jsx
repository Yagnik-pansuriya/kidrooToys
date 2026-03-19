import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiBox, FiShoppingBag, FiTag, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './AdminLayout.scss';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { to: '/admin/products', icon: <FiBox />, label: 'Products' },
    { to: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
    { to: '/admin/offers', icon: <FiTag />, label: 'Offers' },
    { to: '/admin/settings', icon: <FiSettings />, label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <span className="admin-sidebar__logo">🧸</span>
          <span className="admin-sidebar__brand">Kidroo Admin</span>
          <button className="admin-sidebar__close" onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>
        <nav className="admin-sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">A</div>
            <div>
              <span className="admin-sidebar__name">{user?.name || 'Admin'}</span>
              <span className="admin-sidebar__role">Administrator</span>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-topbar__menu" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <h2 className="admin-topbar__title">Admin Panel</h2>
          <NavLink to="/" className="admin-topbar__view-site" target="_blank">View Site →</NavLink>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
