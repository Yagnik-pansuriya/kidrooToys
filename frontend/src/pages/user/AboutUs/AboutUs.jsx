import { FiHeart, FiUsers, FiAward, FiGlobe } from 'react-icons/fi';
import './AboutUs.scss';

const AboutUs = () => {
  const stats = [
    { icon: <FiHeart />, number: '50K+', label: 'Happy Kids' },
    { icon: <FiUsers />, number: '10K+', label: 'Families Trust Us' },
    { icon: <FiAward />, number: '500+', label: 'Premium Toys' },
    { icon: <FiGlobe />, number: '50+', label: 'Cities Served' },
  ];

  const values = [
    { emoji: '🧒', title: 'Child-First Design', desc: 'Every toy is designed with children\'s safety and development in mind.' },
    { emoji: '🌱', title: 'Eco-Friendly', desc: 'We prioritize sustainable materials and responsible manufacturing.' },
    { emoji: '🎓', title: 'Learning Through Play', desc: 'Our toys encourage creativity, critical thinking, and social skills.' },
    { emoji: '💝', title: 'Giving Back', desc: '5% of every purchase goes to children\'s education programs.' },
  ];

  return (
    <div className="about-page">
      <div className="about-page__hero">
        <div className="container">
          <h1 className="about-page__title">About Kidroo Toys 🧸</h1>
          <p className="about-page__subtitle">
            We believe every child deserves toys that spark joy, ignite imagination, and build lasting memories.
          </p>
        </div>
      </div>

      {/* Stats */}
      <section className="about-section">
        <div className="container">
          <div className="about-stats">
            {stats.map((stat, i) => (
              <div className="about-stat" key={i}>
                <span className="about-stat__icon">{stat.icon}</span>
                <span className="about-stat__number">{stat.number}</span>
                <span className="about-stat__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about-section about-section--alt">
        <div className="container">
          <div className="about-story">
            <div className="about-story__content">
              <h2>Our Story ✨</h2>
              <p>
                Founded in 2020, Kidroo Toys started with a simple mission: to bring the
                best quality toys to every Indian household at affordable prices.
              </p>
              <p>
                What began as a small online store has grown into one of India's most trusted
                toy retailers, serving thousands of families across 50+ cities. We carefully
                curate every product in our catalog, ensuring it meets our high standards for
                safety, quality, and educational value.
              </p>
              <p>
                At Kidroo, we're not just selling toys — we're creating moments of joy,
                discovery, and wonder for the next generation.
              </p>
            </div>
            <div className="about-story__visual">
              <div className="about-story__emoji-grid">
                <span>🧸</span><span>🎮</span><span>🎨</span>
                <span>🤖</span><span>🎲</span><span>⚽</span>
                <span>🧩</span><span>🎪</span><span>🎠</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section">
        <div className="container">
          <h2 className="about-section__title">Our Values 💫</h2>
          <div className="about-values">
            {values.map((v, i) => (
              <div className="about-value" key={i}>
                <span className="about-value__emoji">{v.emoji}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
