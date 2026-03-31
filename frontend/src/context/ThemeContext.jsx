import { createContext, useContext, useState, useEffect } from 'react';
import { siteSettings as defaultSettings } from '../mock/users';
import { useGetSettingsQuery } from '../store/ActionApi/settingsApi';
import Loader from '../components/Loader/Loader';

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
const CachedSplash = ({ cached }) => (
  <Loader
    fullscreen
    logo={cached.logo || null}
    colors={{
      primary: cached.primaryColor || '#FF6B35',
      hover:   cached.hoverColor   || '#E55A25',
      header:  cached.headerColor  || '#1A1D2E',
      footer:  cached.footerColor  || '#1A1D2E',
    }}
  />
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
    return <CachedSplash cached={cached} />;
  }

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
