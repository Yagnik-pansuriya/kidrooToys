import { createContext, useContext, useState, useEffect } from 'react';
import { siteSettings as defaultSettings } from '../mock/users';
import { useGetSettingsQuery } from '../store/ActionApi/settingsApi';

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// ─── Map API response shape → internal settings shape ────────────────────────
const mapApiToSettings = (apiData) => ({
  siteName:     apiData.siteName     || defaultSettings.siteName,
  tagline:      apiData.tagline      || defaultSettings.tagline,
  contactEmail: apiData.contactEmail || defaultSettings.contactEmail,
  contactPhone: apiData.contactPhone || defaultSettings.contactPhone,
  logo:         apiData.logo         || null,
  primaryColor: apiData.themeColors?.primary || defaultSettings.primaryColor,
  hoverColor:   apiData.themeColors?.hover   || defaultSettings.hoverColor,
  headerColor:  apiData.themeColors?.header  || defaultSettings.headerColor,
  footerColor:  apiData.themeColors?.footer  || defaultSettings.footerColor,
});

// ─── Apply CSS variables + browser tab title & favicon ───────────────────────
const applyCssVars = (s) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', s.primaryColor);
  root.style.setProperty('--color-hover',   s.hoverColor);
  root.style.setProperty('--color-header',  s.headerColor);
  root.style.setProperty('--color-footer',  s.footerColor);

  // Browser tab title
  if (s.siteName) {
    document.title = s.tagline
      ? `${s.siteName} - ${s.tagline}`
      : s.siteName;
  }

  // Favicon — logo image or fallback 🧸 emoji SVG
  const faviconEl = document.querySelector('link[rel="icon"]')
    || (() => {
      const el = document.createElement('link');
      el.rel = 'icon';
      document.head.appendChild(el);
      return el;
    })();

  if (s.logo) {
    faviconEl.href = s.logo;
    faviconEl.type = 'image/png';
  } else {
    faviconEl.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\uD83E\uDDF8</text></svg>";
    faviconEl.type = 'image/svg+xml';
  }
};

// ─── Read cached settings from localStorage (for splash fallback) ─────────────
const loadFromCache = () => {
  try {
    const saved = localStorage.getItem('kidroo_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        hoverColor:  parsed.hoverColor  || parsed.primaryDark || defaultSettings.hoverColor,
        headerColor: parsed.headerColor || defaultSettings.headerColor,
        footerColor: parsed.footerColor || defaultSettings.footerColor,
      };
    }
  } catch (_) { /* ignore parse errors */ }
  return defaultSettings;
};

// ─── Splash / Loading Screen ──────────────────────────────────────────────────
const AppSplash = ({ cached }) => (
  <div style={{
    position:       'fixed',
    inset:          0,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#ffffff',
    zIndex:         9999,
    gap:            '1rem',
    fontFamily:     'Fredoka, Nunito, sans-serif',
  }}>
    {/* Logo or emoji */}
    {cached.logo ? (
      <img
        src={cached.logo}
        alt={cached.siteName}
        style={{ height: 72, width: 'auto', objectFit: 'contain', borderRadius: 12 }}
      />
    ) : (
      <span style={{ fontSize: '4.5rem', lineHeight: 1 }}>🧸</span>
    )}

    {/* Site name */}
    <h1 style={{
      margin:     0,
      fontSize:   '1.8rem',
      fontWeight: 700,
      color:      cached.primaryColor || '#FF6B35',
      letterSpacing: '-0.5px',
    }}>
      {cached.siteName || 'Kidroo Toys'}
    </h1>

    {/* Spinner dots */}
    <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width:            10,
            height:           10,
            borderRadius:     '50%',
            background:       cached.primaryColor || '#FF6B35',
            display:          'inline-block',
            animation:        `splashDot 1s ease-in-out ${i * 0.2}s infinite`,
            opacity:          0.8,
          }}
        />
      ))}
    </div>

    {/* keyframes injected once */}
    <style>{`
      @keyframes splashDot {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40%            { transform: scale(1);   opacity: 1;   }
      }
    `}</style>
  </div>
);

// ─── ThemeProvider ────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isReady,  setIsReady]  = useState(false);

  // Read cache once for the splash screen (logo, siteName, primaryColor)
  const cached = loadFromCache();

  // 🔑 GET /api/site-settings — must resolve before app renders
  const {
    data:      apiResponse,
    isSuccess,
    isError,
  } = useGetSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // ── On API success: apply fresh settings → show app ─────────────────────────
  useEffect(() => {
    if (isSuccess && apiResponse?.data) {
      const fresh = mapApiToSettings(apiResponse.data);
      applyCssVars(fresh);
      localStorage.setItem('kidroo_settings', JSON.stringify(fresh));
      setSettings(fresh);
      setIsReady(true);
    }
  }, [isSuccess, apiResponse]);

  // ── On API error: fall back to cached settings → still show app ──────────────
  useEffect(() => {
    if (isError) {
      applyCssVars(cached);
      setSettings(cached);
      setIsReady(true);
    }
  }, [isError]);

  // ── Manual override (AdminSettings after a successful PUT) ───────────────────
  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      applyCssVars(updated);
      localStorage.setItem('kidroo_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Block rendering until API responds ───────────────────────────────────────
  if (!isReady) {
    return <AppSplash cached={cached} />;
  }

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
