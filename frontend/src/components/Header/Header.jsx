import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiHeart, FiLogOut } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import './Header.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <NavLink to="/wishlist" className="header__action-btn" title="Wishlist">
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
            <button className="header__action-btn header__logout-btn" onClick={handleLogout} title="Logout">
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

      {/* Mobile Menu */}
      <div className={`header__mobile-menu ${isMobileMenuOpen ? 'header__mobile-menu--open' : ''}`}>
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
          <NavLink to="/wishlist" className="header__mobile-link">
            <FiHeart /> Wishlist {wishlistIds.length > 0 && `(${wishlistIds.length})`}
          </NavLink>
          {isCustomerAuthenticated ? (
            <>
              <NavLink to="/profile" className="header__mobile-link">
                <FiUser /> My Profile
              </NavLink>
              <button className="header__mobile-link" onClick={handleLogout}>
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
  );
};

export default Header;

