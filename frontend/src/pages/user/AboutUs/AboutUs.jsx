import { useEffect, useRef, useState } from 'react';
import { FiHeart, FiUsers, FiAward, FiGlobe, FiArrowDown, FiStar, FiCode, FiGithub, FiLinkedin } from 'react-icons/fi';
import SEO from '../../../components/SEO/SEO';
import Animals3D from '../../../components/Animals3D/Animals3D';
import './AboutUs.scss';

/* ─── Intersection Observer hook ─── */
const useReveal = () => {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.14 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
};

/* ─── Animated counter ─── */
const Counter = ({ value }) => {
  const [n, setN] = useState(0);
  const [ref, on] = useReveal();
  useEffect(() => {
    if (!on) return;
    const num = parseInt(value);
    let i = 0;
    const t = setInterval(() => { i += Math.ceil(num / 50); if (i >= num) { setN(num); clearInterval(t); } else setN(i); }, 30);
    return () => clearInterval(t);
  }, [on, value]);
  return <span ref={ref} className="counter">{n}{value.replace(/\d/g, '')}</span>;
};

/* ─── Reveal wrapper ─── */
const R = ({ children, d = 0, dir = 'up', className = '' }) => {
  const [ref, on] = useReveal();
  return (
    <div ref={ref} className={`rv rv-${dir} ${on ? 'rv-on' : ''} ${className}`} style={{ transitionDelay: `${d}ms` }}>
      {children}
    </div>
  );
};

/* ─── Data ─── */
const STATS = [
  { icon: <FiHeart />, n: '50K+', label: 'Happy Kids', c: '#FF6B35' },
  { icon: <FiUsers />, n: '10K+', label: 'Families', c: '#7B2FF7' },
  { icon: <FiAward />, n: '500+', label: 'Toys', c: '#00D4AA' },
  { icon: <FiGlobe />, n: '50+', label: 'Cities', c: '#F59E0B' },
];

const TOYS = [
  { e: '🧸', name: 'Plush & Soft Toys', c: '#FF6B35', age: '0+', desc: 'Ultra-soft hypoallergenic companions — EN71 & IS 9873 certified for the safest first cuddle.', tags: ['Non-toxic', 'Washable', 'BIS Certified'] },
  { e: '🧩', name: 'Puzzles & Brain Games', c: '#7B2FF7', age: '3+', desc: 'Beautifully illustrated wooden and foam puzzles that sharpen spatial reasoning and problem-solving.', tags: ['Cognitive', 'STEM', 'Eco Wood'] },
  { e: '🎨', name: 'Art & Creativity', c: '#00D4AA', age: '4+', desc: 'Premium art kits — watercolors, clay, sketch pads — nurturing self-expression and fine motor skills.', tags: ['Non-toxic', 'Washable', 'Mess-free'] },
  { e: '🤖', name: 'STEM & Robotics', c: '#F59E0B', age: '8+', desc: 'Coding kits, circuits and robotic sets that turn abstract tech into hands-on adventures.', tags: ['App-linked', 'Real Coding', 'Award Won'] },
  { e: '⚽', name: 'Outdoor & Sports', c: '#22C55E', age: 'All', desc: 'Balance bikes to sport sets — fostering active play, teamwork and a love for the outdoors.', tags: ['BPA-free', 'UV Safe', 'Durable'] },
  { e: '🎲', name: 'Board & Family Games', c: '#EF4444', age: '6+', desc: 'Strategy games and classics that spark family moments and bond generations together.', tags: ['2-6 Players', 'Multi-lang', 'Replayable'] },
];

const MILESTONES = [
  { yr: '2020', txt: 'Kidroo founded — 50 premium hand-picked toys', ic: '🚀' },
  { yr: '2021', txt: '1,000 happy families across India', ic: '💖' },
  { yr: '2022', txt: 'Launched STEM & eco-friendly ranges', ic: '🌱' },
  { yr: '2023', txt: 'Expanded to 50+ cities nationwide', ic: '🗺️' },
  { yr: '2024', txt: '50,000 delighted kids milestone', ic: '🎉' },
  { yr: '2025', txt: 'kidroo.in — your one-stop toy destination', ic: '🌐' },
];

const VALUES = [
  { ic: '🧒', title: 'Child-First', desc: 'Safety & development guide every single decision.', c: '#FF6B35' },
  { ic: '🌱', title: 'Eco-Friendly', desc: 'Sustainable materials, responsible manufacturing.', c: '#22C55E' },
  { ic: '🎓', title: 'Learn & Play', desc: 'Toys that nurture creativity and critical thinking.', c: '#7B2FF7' },
  { ic: '💝', title: 'Give Back', desc: "5% of every order funds children's education.", c: '#F59E0B' },
];

const DEVS = [
  { name: 'Yagnik Pansuriya', role: 'Full Stack Developer', emoji: '👨‍💻', color: '#7B2FF7', github: '#', linkedin: '#', desc: 'Architected the platform, backend APIs and payment integrations.' },
  { name: 'Hardik Kachadiya', role: 'Frontend Developer', emoji: '🎨', color: '#FF6B35', github: '#', linkedin: '#', desc: 'Crafted the UI/UX, animations and responsive design system.' },
  { name: 'Palak Bhalodia', role: 'UI/UX & QA', emoji: '✨', color: '#00D4AA', github: '#', linkedin: '#', desc: 'Designed user flows, component library and quality assurance.' },
];



/* ─── Toy Card ─── */
const ToyCard = ({ t, i }) => {
  const [ref, on] = useReveal();
  return (
    <article ref={ref} className={`tc ${i % 2 ? 'tc--r' : ''} ${on ? 'tc--on' : ''}`} style={{ '--tc': t.c, transitionDelay: `${i * 70}ms` }}>
      <div className="tc__vis">
        <div className="tc__emoji-box">
          <span className="tc__e">{t.e}</span>
        </div>
        <span className="tc__age">Age {t.age}</span>
      </div>
      <div className="tc__body">
        <h3 className="tc__name">{t.name}</h3>
        <p className="tc__desc">{t.desc}</p>
        <div className="tc__tags">
          {t.tags.map((tag, j) => <span key={j} className="tc__tag"><FiStar />{tag}</span>)}
        </div>
      </div>
    </article>
  );
};

/* ─── Developer Card ─── */
const DevCard = ({ dev, i }) => {
  const [hov, setHov] = useState(false);
  return (
    <R d={i * 130} dir="up">
      <div className={`dev-card${hov ? ' dev-card--hov' : ''}`} style={{ '--dc': dev.color }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div className="dev-card__avatar">
          <span className="dev-card__emoji">{dev.emoji}</span>
          <div className="dev-card__ring" />
        </div>
        <div className="dev-card__info">
          <h3 className="dev-card__name">{dev.name}</h3>
          <span className="dev-card__role"><FiCode />{dev.role}</span>
          <p className="dev-card__desc">{dev.desc}</p>
          <div className="dev-card__links">
            <a href={dev.github} aria-label="GitHub" className="dev-card__link"><FiGithub /></a>
            <a href={dev.linkedin} aria-label="LinkedIn" className="dev-card__link"><FiLinkedin /></a>
          </div>
        </div>
      </div>
    </R>
  );
};

/* ─── Main Page ─── */
const AboutUs = () => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About Kidroo Toys', description: "India's most trusted online toy store — safe, fun & educational toys since 2020.", url: 'https://kidroo.in/about', isPartOf: { '@type': 'WebSite', name: 'Kidroo Toys', url: 'https://kidroo.in' } },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Kidroo Toys', url: 'https://kidroo.in', logo: 'https://kidroo.in/logo.png', foundingDate: '2020', areaServed: 'IN', description: "India's trusted online toy store.", contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', areaServed: 'IN', availableLanguage: ['English', 'Hindi'] } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kidroo.in' }, { '@type': 'ListItem', position: 2, name: 'About Us', item: 'https://kidroo.in/about' }] },
  ];

  return (
    <div className="ap">
      <SEO
        title="About Us – India's Most Trusted Toy Store | Kidroo"
        description="Discover Kidroo Toys — India's #1 trusted online toy store since 2020. Safe, eco-friendly & educational toys for children aged 0-14+. Serving 50K+ kids in 50+ cities."
        keywords="about kidroo toys, kidroo.in, online toy store India, kids toys, educational toys, safe toys India"
        canonical="https://kidroo.in/about"
        image="https://kidroo.in/og-about.jpg"
        jsonLd={jsonLd}
      />

      {/* ── HERO ── */}
      <section className="hero" aria-label="About Kidroo">
        <div className="hero__bg" aria-hidden="true">
          {['🧸','⭐','🎈','🌈','✨','🎪','🎡','💫','🌟','🎯','🦋','🎠'].map((p, i) => (
            <span key={i} className="hp" style={{ '--hx': `${(i * 39 + 5) % 92}%`, '--hd': `${i * 0.38}s`, '--hs': `${1.1 + (i % 3) * 0.5}rem`, '--hdu': `${4 + i % 4}s` }}>{p}</span>
          ))}
        </div>
        <div className="hero__c container" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className="hero__pill">🧸 Our Story</div>
          <h1 className="hero__h1">We Make Childhood<br /><span className="hero__shine">Magical</span></h1>
          <p className="hero__sub">India's most trusted toy store — safe, joyful & educational toys for every child since 2020.</p>
          <div className="hero__hint" aria-label="Scroll down">
            <span>Scroll to explore</span>
            <FiArrowDown className="hero__arrow" />
          </div>
        </div>
        <div className="hero__wave" aria-hidden="true">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,50 C480,100 960,0 1440,50 L1440,100 L0,100Z" fill="var(--color-bg)" /></svg>
        </div>
      </section>

      {/* ── 3D ANIMALS ── */}
      <Animals3D />

      {/* ── STATS ── */}
      <section className="stats-sec" aria-label="Key statistics">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <R key={i} d={i * 110} dir="up">
                <div className="scard" style={{ '--sc': s.c }}>
                  <div className="scard__icon">{s.icon}</div>
                  <Counter value={s.n} />
                  <span className="scard__label">{s.label}</span>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="tl-sec" aria-label="Our journey">
        <div className="container">
          <R dir="up"><span className="chip">✨ Our Journey</span><h2 className="sec-h2">From a Dream to India's Toy Destination</h2></R>
          <div className="tl">
            <div className="tl__line" aria-hidden="true" />
            {MILESTONES.map((m, i) => (
              <R key={i} d={i * 90} dir={i % 2 ? 'right' : 'left'}>
                <div className={`tl__row tl__row--${i % 2 ? 'r' : 'l'}`}>
                  <div className="tl__dot">{m.ic}</div>
                  <div className="tl__card">
                    <b className="tl__yr">{m.yr}</b>
                    <p className="tl__txt">{m.txt}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOY SHOWCASE ── */}
      <section className="toys-sec" aria-label="Toy categories">
        <div className="container">
          <R dir="up">
            <span className="chip">🎁 What We Offer</span>
            <h2 className="sec-h2">Toys for Every Little Adventurer</h2>
            <p className="sec-sub">Scroll through our hand-curated categories — designed to delight and develop.</p>
          </R>
          <div className="toy-list">
            {TOYS.map((t, i) => <ToyCard key={i} t={t} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="vals-sec" aria-label="Our values">
        <div className="container">
          <R dir="up"><span className="chip">💫 Our Values</span><h2 className="sec-h2">What Drives Us Every Day</h2></R>
          <div className="vals-grid">
            {VALUES.map((v, i) => (
              <R key={i} d={i * 100} dir="up">
                <div className="vcard" style={{ '--vc': v.c }}>
                  <div className="vcard__icon">{v.ic}</div>
                  <h3 className="vcard__title">{v.title}</h3>
                  <p className="vcard__desc">{v.desc}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVELOPERS ── */}
      <section className="devs-sec" aria-label="Meet the team">
        <div className="container">
          <R dir="up">
            <span className="chip">👨‍💻 Behind the Magic</span>
            <h2 className="sec-h2">Meet the Developers</h2>
            <p className="sec-sub">The brilliant minds who built Kidroo with passion, code & a lot of ☕</p>
          </R>
          <div className="devs-grid">
            {DEVS.map((dev, i) => <DevCard key={i} dev={dev} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-sec" aria-label="Call to action">
        <div className="cta-sec__bg" aria-hidden="true">
          {['🎈', '⭐', '✨', '🎉', '💫', '🌟'].map((p, i) => (
            <span key={i} className="cp" style={{ '--cx': `${i * 17 + 4}%`, '--cd': `${i * 0.45}s` }}>{p}</span>
          ))}
        </div>
        <div className="container">
          <R dir="up">
            <h2 className="cta-sec__h2">Ready to Spark Some Joy? 🚀</h2>
            <p className="cta-sec__sub">Browse 500+ premium, safe & educational toys — delivered to your door.</p>
            <a href="/shop" className="cta-sec__btn">Explore Our Toys</a>
          </R>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
