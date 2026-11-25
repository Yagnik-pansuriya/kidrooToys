import { useState, useEffect, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX, FiExternalLink } from 'react-icons/fi';
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
  MdViewCarousel,
  MdExtension,
  MdPersonSearch,
  MdShoppingCart
} from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setPermissions } from '../../../store/ReducerApi/authSlice';
import { useGetUserPermissionsQuery } from '../../../store/ActionApi/permissionApi';
import { useTheme } from '../../../context/ThemeContext';
import { trimmedLogoUrl } from '../../../utils/logoUrl';
import AdminRealtime from '../../../components/AdminRealtime/AdminRealtime';
import './admin-theme.scss';
import './AdminLayout.scss';

// Map sidebar items to their backend permission route; `section` only groups them visually
const allNavItems = [
  { to: '/admin/dashboard', icon: <MdDashboard />, label: 'Dashboard', permRoute: null, section: 'Overview' },
  { to: '/admin/orders', icon: <MdShoppingBag />, label: 'Orders', permRoute: null, section: 'Sales' },
  { to: '/admin/customers', icon: <MdPersonSearch />, label: 'Customers', permRoute: null, adminOnly: true, section: 'Sales' },
  { to: '/admin/carts', icon: <MdShoppingCart />, label: 'Carts', permRoute: null, adminOnly: true, section: 'Sales' },
  { to: '/admin/products', icon: <MdInventory />, label: 'Products', permRoute: '/products', section: 'Catalog' },
  { to: '/admin/categories', icon: <MdCategory />, label: 'Categories', permRoute: '/categories', section: 'Catalog' },
  { to: '/admin/skills', icon: <MdExtension />, label: 'Skills', permRoute: '/skills', section: 'Catalog' },
  { to: '/admin/reviews', icon: <MdRateReview />, label: 'Reviews', permRoute: '/reviews', section: 'Catalog' },
  { to: '/admin/offers', icon: <MdLocalOffer />, label: 'Offers & Coupons', permRoute: '/offers', section: 'Marketing' },
  { to: '/admin/banners', icon: <MdViewCarousel />, label: 'Banners', permRoute: '/banners', section: 'Marketing' },
  { to: '/admin/newsletter', icon: <MdEmail />, label: 'Newsletter', permRoute: '/newsletter', section: 'Marketing' },
  { to: '/admin/users', icon: <MdPeople />, label: 'Users', permRoute: '/users', adminOnly: true, section: 'System' },
  { to: '/admin/settings', icon: <MdSettings />, label: 'Settings', permRoute: '/site-settings', section: 'System' },
];

// Detail routes (e.g. /admin/customers/:id) take the title of their parent list
const pageTitleFor = (pathname) => {
  const item = allNavItems.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return item?.label || 'Admin';
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { user, permissions } = useSelector((state) => state.auth);
  const { settings } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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

  // Consecutive items of the same section render under one heading
  const navSections = navItems.reduce((sections, item) => {
    const last = sections[sections.length - 1];
    if (last && last.title === item.section) last.items.push(item);
    else sections.push({ title: item.section, items: [item] });
    return sections;
  }, []);

  const siteName = settings.siteName || 'Kidroo';

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`} aria-label="Admin navigation">
        <div className="admin-sidebar__header">
          {settings.logo ? (
            <img src={trimmedLogoUrl(settings.logo)} alt={siteName} className="admin-sidebar__logo-img" />
          ) : (
            <span className="admin-sidebar__logo" aria-hidden="true">{siteName[0].toUpperCase()}</span>
          )}
          <div className="admin-sidebar__brand-wrap">
            <span className="admin-sidebar__brand">{siteName}</span>
            <span className="admin-sidebar__brand-sub">Admin</span>
          </div>
          <button className="admin-sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><FiX /></button>
        </div>
        <nav className="admin-sidebar__nav">
          {navSections.map((section) => (
            <div key={section.title} className="admin-sidebar__section">
              <span className="admin-sidebar__section-title">{section.title}</span>
              {section.items.map(item => (
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
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{(user?.name || 'A')[0].toUpperCase()}</div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__name">{user?.name || 'Admin'}</span>
              <span className="admin-sidebar__role">{user?.role || 'Administrator'}</span>
            </div>
            <button className="admin-sidebar__logout" onClick={handleLogout} aria-label="Logout" title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button className="admin-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <FiMenu />
            </button>
            <h2 className="admin-topbar__title">{pageTitleFor(pathname)}</h2>
          </div>
          <div className="admin-topbar__actions">
            <AdminRealtime />
            <NavLink to="/" className="admin-topbar__view-site" target="_blank">
              <FiExternalLink />
              <span>View site</span>
            </NavLink>
          </div>
        </header>
        <main className="admin-content">
          {/* Admin pages load on demand; keep the sidebar/topbar while one downloads */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
