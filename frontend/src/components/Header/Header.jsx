import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  FiShoppingCart, FiUser, FiX, FiHeart, FiLogOut,
  FiHome, FiShoppingBag, FiTag, FiInfo, FiChevronRight, FiPhone,
} from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { trimmedLogoUrl } from '../../utils/logoUrl';
import UserConfirmModal from '../ConfirmModal/UserConfirmModal';
import './Header.scss';

const navLinks = [
  { to: '/', label: 'Home', icon: FiHome, tint: 'orange' },
  { to: '/shop', label: 'Shop', icon: FiShoppingBag, tint: 'purple' },
  { to: '/offers', label: 'Offers', icon: FiTag, tint: 'pink', badge: '🔥' },
  { to: '/about', label: 'About Us', icon: FiInfo, tint: 'teal' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { settings } = useTheme();
  const { customer, isCustomerAuthenticated, wishlistIds, openAuthModal, handleLogout } = useCustomerAuth();
  const location = useLocation();
  const logoSrc = trimmedLogoUrl(settings.logo);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Lock page scroll and allow Escape to close while the drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setIsMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobileMenuOpen]);

  const handleUserIconClick = () => {
    if (!isCustomerAuthenticated) {
      openAuthModal('Login to access your profile');
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const renderLogo = (className) => (
    logoSrc ? (
      <img src={logoSrc} alt={settings.siteName || 'Kidroo'} className={className} />
    ) : (
      <span className="header__logo-text">
        <span className="header__logo-icon">🧸</span>
        <span className="header__logo-name">{settings.siteName || 'Kidroo'}</span>
      </span>
    )
  );

  const mobileDrawer = (
    <>
      <div
        className={`header-drawer__backdrop ${isMobileMenuOpen ? 'header-drawer__backdrop--visible' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        className={`header-drawer ${isMobileMenuOpen ? 'header-drawer--open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
        aria-label="Main menu"
      >
        {/* Drawer top band (dark, so the white logo stays visible) */}
        <div className="header-drawer__top">
          <span className="header-drawer__bubble header-drawer__bubble--1" />
          <span className="header-drawer__bubble header-drawer__bubble--2" />
          <span className="header-drawer__bubble header-drawer__bubble--3" />

          <div className="header-drawer__top-row">
            <Link to="/" className="header-drawer__logo" onClick={closeMenu}>
              {renderLogo('header-drawer__logo-img')}
            </Link>
            <button className="header-drawer__close" onClick={closeMenu} aria-label="Close menu">
              <FiX />
            </button>
          </div>

          <p className="header-drawer__greeting">
            {isCustomerAuthenticated
              ? <>Hi, <strong>{customer?.firstName || 'there'}</strong> 👋</>
              : <>Welcome to <strong>{settings.siteName || 'Kidroo'}</strong> 🎈</>}
          </p>
        </div>

        <nav className="header-drawer__nav">
          <span className="header-drawer__label">Menu</span>
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={{ '--i': i }}
                className={({ isActive }) => `header-drawer__link ${isActive ? 'header-drawer__link--active' : ''}`}
              >
                <span className={`header-drawer__icon header-drawer__icon--${link.tint}`}><Icon /></span>
                <span className="header-drawer__text">{link.label}</span>
                {link.badge && <span className="header-drawer__badge">{link.badge}</span>}
                <FiChevronRight className="header-drawer__chevron" />
              </NavLink>
            );
          })}

          <span className="header-drawer__label" style={{ '--i': 4 }}>My Account</span>

          <NavLink
            to="/wishlist"
            style={{ '--i': 5 }}
            className={({ isActive }) => `header-drawer__link ${isActive ? 'header-drawer__link--active' : ''}`}
          >
            <span className="header-drawer__icon header-drawer__icon--red"><FiHeart /></span>
            <span className="header-drawer__text">Wishlist</span>
            {wishlistIds.length > 0 && <span className="header-drawer__count">{wishlistIds.length}</span>}
            <FiChevronRight className="header-drawer__chevron" />
          </NavLink>

          <button
            className="header-drawer__link"
            style={{ '--i': 6 }}
            onClick={() => { closeMenu(); setIsCartOpen(true); }}
          >
            <span className="header-drawer__icon header-drawer__icon--orange"><FiShoppingCart /></span>
            <span className="header-drawer__text">My Cart</span>
            {cartCount > 0 && <span className="header-drawer__count header-drawer__count--primary">{cartCount}</span>}
            <FiChevronRight className="header-drawer__chevron" />
          </button>

          {isCustomerAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                style={{ '--i': 7 }}
                className={({ isActive }) => `header-drawer__link ${isActive ? 'header-drawer__link--active' : ''}`}
              >
                <span className="header-drawer__icon header-drawer__icon--teal"><FiUser /></span>
                <span className="header-drawer__text">My Profile</span>
                <FiChevronRight className="header-drawer__chevron" />
              </NavLink>
              <button
                className="header-drawer__link header-drawer__link--danger"
                style={{ '--i': 8 }}
                onClick={() => { closeMenu(); setShowLogoutConfirm(true); }}
              >
                <span className="header-drawer__icon header-drawer__icon--red"><FiLogOut /></span>
                <span className="header-drawer__text">Logout</span>
              </button>
            </>
          ) : (
            <button
              className="header-drawer__cta"
              style={{ '--i': 7 }}
              onClick={() => { closeMenu(); openAuthModal(); }}
            >
              <FiUser /> Login / Sign Up
            </button>
          )}
        </nav>

        {settings.contactPhone && (
          <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`} className="header-drawer__help">
            <span className="header-drawer__help-icon"><FiPhone /></span>
            <span>
              <small>Need help? Call us</small>
              <strong>{settings.contactPhone.trim()}</strong>
            </span>
          </a>
        )}
      </aside>
    </>
  );

  return (
    <>
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header__container">
        {/* Logo */}
        <Link to="/" className="header__logo" aria-label={settings.siteName || 'Kidroo'}>
          {renderLogo('header__logo-img')}
        </Link>

        {/* Desktop Nav */}
        <nav className="header__nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
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
          <NavLink to="/wishlist" className="header__action-btn header__wishlist-btn header__hide-xs" title="Wishlist">
            <FiHeart />
            {wishlistIds.length > 0 && (
              <span key={wishlistIds.length} className="header__wishlist-count">{wishlistIds.length}</span>
            )}
          </NavLink>

          {/* User / Profile */}
          {isCustomerAuthenticated ? (
            <NavLink to="/profile" className="header__action-btn header__user-btn header__hide-xs" title={`Hi, ${customer?.firstName || 'User'}`}>
              <FiUser />
              <span className="header__user-name">{customer?.firstName || 'User'}</span>
            </NavLink>
          ) : (
            <button className="header__action-btn header__hide-xs" onClick={handleUserIconClick} title="Login">
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
              <span key={cartCount} className="header__cart-count">{cartCount}</span>
            )}
          </button>

          {/* Logout (only when logged in) */}
          {isCustomerAuthenticated && (
            <button className="header__action-btn header__logout-btn" onClick={() => setShowLogoutConfirm(true)} title="Logout">
              <FiLogOut />
            </button>
          )}

          <button
            className={`header__mobile-toggle ${isMobileMenuOpen ? 'header__mobile-toggle--open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Playful animated colour strip under the header */}
      <div className="header__strip" aria-hidden="true" />
    </header>

    {createPortal(mobileDrawer, document.body)}

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
