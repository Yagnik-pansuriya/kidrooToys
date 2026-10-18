import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useGetCategoriesQuery } from '../../store/ActionApi/categoryApi';
import { useTheme } from '../../context/ThemeContext';
import './Footer.scss';

const Footer = () => {
  const { settings } = useTheme();

  // ── Fetch dynamic categories from API (http://localhost:5000/api/categories) ──
  const { data: categoryResp } = useGetCategoriesQuery();
  const reduxCategories = useSelector((s) => s.category?.categories) || [];

  const rawCategories = categoryResp?.data || categoryResp || reduxCategories;
  const allCategories = Array.isArray(rawCategories)
    ? rawCategories
    : Array.isArray(rawCategories?.data)
    ? rawCategories.data
    : [];

  const activeCategories = allCategories.filter((c) => c.isActive !== false);

  return (
    <footer className="footer">
      <div className="footer__wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C360,120 720,0 1440,60 L1440,120 L0,120 Z" fill="var(--color-primary)" opacity="0.1" />
          <path d="M0,80 C360,20 720,120 1440,80 L1440,120 L0,120 Z" fill="var(--color-primary)" opacity="0.05" />
        </svg>
      </div>
      <div className="footer__content">
        <div className="container">
          <div className="footer__grid">
            {/* Brand */}
            <div className="footer__brand">
              <div className="footer__logo">
                {settings.logo ? (
                  <img src={settings.logo} alt={settings.siteName || 'Kidroo Toys'} className="footer__logo-img" />
                ) : (
                  <>
                    <span className="footer__logo-icon">🧸</span>
                    <span className="footer__logo-name">{settings.siteName || 'Kidroo Toys'}</span>
                  </>
                )}
              </div>
              <p className="footer__tagline">{settings.tagline}</p>
              <div className="footer__social">
                <a href={settings.socialLinks?.facebook} target="_blank" rel="noreferrer" className="footer__social-link"><FiFacebook /></a>
                <a href={settings.socialLinks?.instagram} target="_blank" rel="noreferrer" className="footer__social-link"><FiInstagram /></a>
                <a href={settings.socialLinks?.twitter} target="_blank" rel="noreferrer" className="footer__social-link"><FiTwitter /></a>
                <a href={settings.socialLinks?.youtube} target="_blank" rel="noreferrer" className="footer__social-link"><FiYoutube /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer__section">
              <h4 className="footer__section-title">Quick Links</h4>
              <ul className="footer__links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/shop">Shop All</Link></li>
                <li><Link to="/offers">Offers</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/profile">My Account</Link></li>
              </ul>
            </div>

            {/* Categories — Dynamic from http://localhost:5000/api/categories */}
            <div className="footer__section">
              <h4 className="footer__section-title">Categories</h4>
              <ul className="footer__links">
                {activeCategories.length > 0 ? (
                  activeCategories.slice(0, 6).map((cat) => {
                    const name = cat.catagoryName || cat.name;
                    const url = cat.slug
                      ? `/category/${cat.slug}`
                      : `/shop?category=${cat._id || cat.id}`;
                    return (
                      <li key={cat._id || cat.id || cat.slug}>
                        <Link to={url}>{name}</Link>
                      </li>
                    );
                  })
                ) : (
                  <>
                    <li><Link to="/category/puzzles-brain-games">Puzzles & Brain Games</Link></li>
                    <li><Link to="/category/art-craft-kits">Art & Craft Kits</Link></li>
                    <li><Link to="/category/toy-vehicles">Toy Vehicles</Link></li>
                  </>
                )}
                <li>
                  <Link to="/shop" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                    View All Categories →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer__section">
              <h4 className="footer__section-title">Contact Us</h4>
              <ul className="footer__contact">
                <li><FiMail /> <span>{settings.contactEmail}</span></li>
                <li><FiPhone /> <span>{settings.contactPhone}</span></li>
                <li><FiMapPin /> <span>Morbi , Guajarat</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <p>&copy; 2026 {settings.siteName || 'Kidroo Toys'}. All rights reserved. Made with ❤️ for kids.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
