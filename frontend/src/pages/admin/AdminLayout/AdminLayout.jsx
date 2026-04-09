import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { 
  MdDashboard, 
  MdCategory, 
  MdInventory, 
  MdShoppingBag, 
  MdLocalOffer, 
  MdPeople, 
  MdSettings,
  MdEmail,
  MdRateReview,
  MdViewCarousel
} from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setPermissions } from '../../../store/ReducerApi/authSlice';
import { useGetUserPermissionsQuery } from '../../../store/ActionApi/permissionApi';
import { useTheme } from '../../../context/ThemeContext';
import './AdminLayout.scss';

// Map sidebar items to their backend permission route
const allNavItems = [
  { to: '/admin/dashboard', icon: <MdDashboard />, label: 'Dashboard', permRoute: null },
  { to: '/admin/categories', icon: <MdCategory />, label: 'Categories', permRoute: '/categories' },
  { to: '/admin/products', icon: <MdInventory />, label: 'Products', permRoute: '/products' },
  { to: '/admin/orders', icon: <MdShoppingBag />, label: 'Orders', permRoute: null },
  { to: '/admin/offers', icon: <MdLocalOffer />, label: 'Offers', permRoute: '/offers' },
  { to: '/admin/banners', icon: <MdViewCarousel />, label: 'Banners', permRoute: '/banners' },
  { to: '/admin/newsletter', icon: <MdEmail />, label: 'Newsletter', permRoute: '/newsletter' },
  { to: '/admin/reviews', icon: <MdRateReview />, label: 'Reviews', permRoute: '/reviews' },
  { to: '/admin/users', icon: <MdPeople />, label: 'Users', permRoute: '/users', adminOnly: true },
  { to: '/admin/settings', icon: <MdSettings />, label: 'Settings', permRoute: '/site-settings' },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { user, permissions } = useSelector((state) => state.auth);
  const { settings } = useTheme();
  const navigate = useNavigate();

  // Re-fetch permissions from backend on every load/refresh (for non-admin users)
  // Admin role has all permissions so skip the call for them
  const isAdmin = user?.role === 'admin';
  const { data: permData } = useGetUserPermissionsQuery(user?._id || user?.id, {
    skip: !user || isAdmin,
    refetchOnMountOrArgChange: true,
  });

  // Sync fresh permissions into Redux store whenever they arrive
  useEffect(() => {
    if (permData?.data) {
      dispatch(setPermissions(permData.data));
    } else if (Array.isArray(permData)) {
      dispatch(setPermissions(permData));
    }
  }, [permData, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin');
  };


  // navItems — admin sees all; other roles see only permitted items


  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter((item) => {
        // adminOnly items are hidden for non-admin roles
        if (item.adminOnly) return false;
        // Items with no permRoute are always visible (Dashboard, Orders)
        if (!item.permRoute) return true;
        // Check if user has this route as visible in their permissions
        const perm = permissions.find((p) => p.route === item.permRoute);
        return perm?.visible === true;
      });

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.siteName || 'Kidroo'} className="admin-sidebar__logo-img" />
          ) : (
            <span className="admin-sidebar__logo">🧸</span>
          )}
          <span className="admin-sidebar__brand">{settings.siteName ? `${settings.siteName} Admin` : 'Kidroo Admin'}</span>
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
            <div className="admin-sidebar__avatar">{(user?.name || 'A')[0].toUpperCase()}</div>
            <div>
              <span className="admin-sidebar__name">{user?.name || 'Admin'}</span>
              <span className="admin-sidebar__role">{user?.role || 'Administrator'}</span>
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
