import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { settings } = useTheme();
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
          <NavLink to="/profile" className="header__action-btn" title="Profile">
            <FiUser />
          </NavLink>
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
          <NavLink to="/profile" className="header__mobile-link">
            <FiUser /> Profile
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
