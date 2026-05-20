import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiHeart, FiLogOut } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import UserConfirmModal from '../ConfirmModal/UserConfirmModal';
import './Header.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { settings } = useTheme();
  const { customer, isCustomerAuthenticated, wishlistIds, openAuthModal, handleLogout } = useCustomerAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/offers', label: 'Offers', badge: '🔥' },
    { to: '/about', label: 'About Us' },
  ];

  const handleUserIconClick = () => {
    if (!isCustomerAuthenticated) {
      openAuthModal('Login to access your profile');
    }
  };

  return (
    <>
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header__container">
        {/* Logo */}
        <Link to="/" className="header__logo">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.siteName} className="header__logo-img" />
          ) : (
            <div className="header__logo-text">
              <span className="header__logo-icon">🧸</span>
              <span className="header__logo-name">{settings.siteName || 'Kidroo'}</span>
            </div>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="header__nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            >
              {link.label}
              {link.badge && <span className="header__nav-badge">{link.badge}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          {/* Wishlist */}
          <NavLink to="/wishlist" className="header__action-btn header__wishlist-btn" title="Wishlist">
            <FiHeart />
            {wishlistIds.length > 0 && (
              <span className="header__wishlist-count">{wishlistIds.length}</span>
            )}
          </NavLink>

          {/* User / Profile */}
          {isCustomerAuthenticated ? (
            <NavLink to="/profile" className="header__action-btn header__user-btn" title={`Hi, ${customer?.firstName || 'User'}`}>
              <FiUser />
              <span className="header__user-name">{customer?.firstName || 'User'}</span>
            </NavLink>
          ) : (
            <button className="header__action-btn" onClick={handleUserIconClick} title="Login">
              <FiUser />
            </button>
          )}

          {/* Cart */}
          <button
            className="header__action-btn header__cart-btn"
            onClick={() => setIsCartOpen(true)}
            title="Cart"
          >
            <FiShoppingCart />
            {cartCount > 0 && (
              <span className="header__cart-count">{cartCount}</span>
            )}
          </button>

          {/* Logout (only when logged in) */}
          {isCustomerAuthenticated && (
            <button className="header__action-btn header__logout-btn" onClick={() => setShowLogoutConfirm(true)} title="Logout">
              <FiLogOut />
            </button>
          )}

          <button
            className="header__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="header__mobile-menu-backdrop header__mobile-menu-backdrop--visible"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`header__mobile-menu ${isMobileMenuOpen ? 'header__mobile-menu--open' : ''}`}>
        {/* Drawer Header */}
        <div className="header__mobile-header">
          <Link to="/" className="header__logo" onClick={() => setIsMobileMenuOpen(false)}>
            {settings.logo ? (
              <img src={settings.logo} alt={settings.siteName} className="header__logo-img" />
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                {settings.siteName || 'Kidroo'}
              </span>
            )}
          </Link>
          <button className="header__mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="header__mobile-nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `header__mobile-link ${isActive ? 'header__mobile-link--active' : ''}`}
            >
              {link.label}
              {link.badge && <span className="header__nav-badge">{link.badge}</span>}
            </NavLink>
          ))}

          <div className="header__mobile-divider" />

          <NavLink to="/wishlist" className="header__mobile-link">
            <FiHeart /> Wishlist
            {wishlistIds.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#e74c3c', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                {wishlistIds.length}
              </span>
            )}
          </NavLink>

          {isCustomerAuthenticated ? (
            <>
              <NavLink to="/profile" className="header__mobile-link">
                <FiUser /> My Profile
              </NavLink>
              <button className="header__mobile-link" style={{ color: '#e74c3c' }} onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <button className="header__mobile-link" onClick={() => { setIsMobileMenuOpen(false); openAuthModal(); }}>
              <FiUser /> Login / Sign Up
            </button>
          )}
        </nav>
      </div>
    </header>

    {/* Logout Confirmation Modal */}
    <UserConfirmModal
      isOpen={showLogoutConfirm}
      title="Log out of Kidroo?"
      message="Are you sure you want to log out? You'll need to sign in again to access your account."
      confirmText="Yes, Log Out"
      cancelText="Stay Logged In"
      variant="warning"
      onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
      onClose={() => setShowLogoutConfirm(false)}
    />
    </>
  );
};

export default Header;

