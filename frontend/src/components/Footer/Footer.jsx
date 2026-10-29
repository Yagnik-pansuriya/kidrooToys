import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiMail, FiPhone, FiMapPin, FiArrowUp, FiSend, FiChevronRight, FiTruck, FiShield, FiSmile } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useGetCategoriesQuery } from '../../store/ActionApi/categoryApi';
import { useSubscribeMutation } from '../../store/ActionApi/newsletterApi';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { trimmedLogoUrl } from '../../utils/logoUrl';
import './Footer.scss';

// Same profiles as the Organization "sameAs" in index.html
const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/kidrootoys/', label: 'Facebook', icon: FiFacebook },
  { href: 'https://www.instagram.com/kidrootoys/', label: 'Instagram', icon: FiInstagram },
];

const PROMISES = [
  { icon: FiShield, title: 'Safe & BIS Approved', text: 'Child-safe materials only' },
  { icon: FiTruck, title: 'Fast Delivery', text: 'Shipped across India' },
  { icon: FiSmile, title: 'Happy Kids', text: 'Toys that spark joy' },
];

const FOOTER_TOYS = ['🧸', '🎈', '🪀', '🧩', '🚂', '⭐'];

const Footer = () => {
  const { settings } = useTheme();
  const { showSuccess, showError } = useToast();
  const { requireAuth } = useCustomerAuth();
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const [email, setEmail] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

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

  // Play the entrance animation once the footer scrolls into view
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        io.disconnect();
      }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const phone = (settings.contactPhone || '').trim();
  const phoneDigits = phone.replace(/\D/g, '');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!requireAuth('Please login to subscribe')) return;
    if (!email.trim()) return;
    try {
      await subscribe(email.trim()).unwrap();
      showSuccess('🎉 Welcome to the Kidroo family!');
      setEmail('');
    } catch (err) {
      showError(err?.data?.message || 'Subscription failed');
    }
  };

  const titleCase = (text = '') => text.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <footer className={`footer ${isVisible ? 'footer--visible' : ''}`} ref={footerRef}>
      <div className="footer__wave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path className="footer__wave-back" d="M0,64 C240,112 480,16 720,48 C960,80 1200,24 1440,56 L1440,120 L0,120 Z" />
          <path className="footer__wave-front" d="M0,80 C320,40 560,110 840,76 C1080,48 1260,96 1440,72 L1440,120 L0,120 Z" />
        </svg>
      </div>

      <div className="footer__content">
        <div className="footer__toys" aria-hidden="true">
          {FOOTER_TOYS.map((toy, i) => (
            <span key={i} style={{ '--i': i }}>{toy}</span>
          ))}
        </div>

        <div className="container">
          {/* Newsletter card */}
          <div className="footer__news footer__reveal" style={{ '--d': 0 }}>
            <div className="footer__news-text">
              <h3>Join the Kidroo Club 🎉</h3>
              <p>New toys, exclusive deals and fun ideas for little ones — straight to your inbox.</p>
            </div>
            <form className="footer__news-form" onSubmit={handleSubscribe}>
              <FiMail className="footer__news-icon" />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                required
              />
              <button type="submit" disabled={subscribing}>
                {subscribing ? '...' : <>Subscribe <FiSend /></>}
              </button>
            </form>
          </div>

          <div className="footer__grid">
            {/* Brand */}
            <div className="footer__brand footer__reveal" style={{ '--d': 1 }}>
              <Link to="/" className="footer__logo">
                {settings.logo ? (
                  <img src={trimmedLogoUrl(settings.logo)} alt={settings.siteName || 'Kidroo Toys'} className="footer__logo-img" />
                ) : (
                  <>
                    <span className="footer__logo-icon">🧸</span>
                    <span className="footer__logo-name">{settings.siteName || 'Kidroo Toys'}</span>
                  </>
                )}
              </Link>
              <p className="footer__tagline">{settings.tagline}</p>
              <div className="footer__social">
                {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className="footer__social-link" aria-label={label} title={label}>
                    <Icon />
                  </a>
                ))}
                {phoneDigits && (
                  <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className="footer__social-link footer__social-link--wa" aria-label="WhatsApp" title="WhatsApp">
                    <FaWhatsapp />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer__section footer__reveal" style={{ '--d': 2 }}>
              <h4 className="footer__section-title">Quick Links</h4>
              <ul className="footer__links">
                <li><Link to="/"><FiChevronRight />Home</Link></li>
                <li><Link to="/shop"><FiChevronRight />Shop All</Link></li>
                <li><Link to="/offers"><FiChevronRight />Offers</Link></li>
                <li><Link to="/about"><FiChevronRight />About Us</Link></li>
                <li><Link to="/profile"><FiChevronRight />My Account</Link></li>
              </ul>
            </div>

            {/* Categories — Dynamic from http://localhost:5000/api/categories */}
            <div className="footer__section footer__reveal" style={{ '--d': 3 }}>
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
                        <Link to={url}><FiChevronRight />{titleCase(name)}</Link>
                      </li>
                    );
                  })
                ) : (
                  <>
                    <li><Link to="/category/puzzles-brain-games"><FiChevronRight />Puzzles & Brain Games</Link></li>
                    <li><Link to="/category/art-craft-kits"><FiChevronRight />Art & Craft Kits</Link></li>
                    <li><Link to="/category/toy-vehicles"><FiChevronRight />Toy Vehicles</Link></li>
                  </>
                )}
                <li>
                  <Link to="/shop" className="footer__links-all">
                    View All Categories →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer__section footer__reveal" style={{ '--d': 4 }}>
              <h4 className="footer__section-title">Contact Us</h4>
              <ul className="footer__contact">
                {settings.contactEmail && (
                  <li>
                    <a href={`mailto:${settings.contactEmail}`}>
                      <span className="footer__contact-icon"><FiMail /></span>
                      <span>{settings.contactEmail}</span>
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                      <span className="footer__contact-icon"><FiPhone /></span>
                      <span>{phone}</span>
                    </a>
                  </li>
                )}
                <li>
                  <span className="footer__contact-row">
                    <span className="footer__contact-icon"><FiMapPin /></span>
                    <span>Morbi, Gujarat, India</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust promises */}
          <div className="footer__promises">
            {PROMISES.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="footer__promise footer__reveal" style={{ '--d': 5 + i }}>
                <span className="footer__promise-icon"><Icon /></span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <div className="container footer__bottom-inner">
            <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Kidroo Toys'}. All rights reserved. Made with <span className="footer__heart">❤️</span> for kids.</p>
            <button
              type="button"
              className="footer__top-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
            >
              <FiArrowUp />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
