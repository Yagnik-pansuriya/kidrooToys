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

  // ── Browser tab title ────────────────────────────────────────────────────
  if (s.siteName) {
    document.title = s.tagline
      ? `${s.siteName} - ${s.tagline}`
      : s.siteName;
  }

  // ── Favicon — use logo URL if available, else fall back to 🧸 emoji SVG ──
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

// ─── Read cached settings from localStorage (used on first render) ────────────
const loadFromCache = () => {
  try {
    const saved = localStorage.getItem('kidroo_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        // migrate old field names if present
        hoverColor:  parsed.hoverColor  || parsed.primaryDark || defaultSettings.hoverColor,
        headerColor: parsed.headerColor || defaultSettings.headerColor,
        footerColor: parsed.footerColor || defaultSettings.footerColor,
      };
    }
  } catch (_) { /* ignore parse errors */ }
  return defaultSettings;
};

export const ThemeProvider = ({ children }) => {
  // 1️⃣ Instantly hydrate from localStorage so there is no colour flash on load
  const [settings, setSettings] = useState(() => {
    const cached = loadFromCache();
    applyCssVars(cached); // apply synchronously before first paint
    return cached;
  });

  // 2️⃣ Fire GET /api/site-settings on every mount / refresh
  const { data: apiResponse, isSuccess } = useGetSettingsQuery(undefined, {
    // Always refetch on mount so the site always reflects the latest admin settings
    refetchOnMountOrArgChange: true,
  });

  // 3️⃣ When the API responds, merge → apply CSS vars → persist to localStorage
  useEffect(() => {
    if (isSuccess && apiResponse?.data) {
      const fresh = mapApiToSettings(apiResponse.data);
      applyCssVars(fresh);
      localStorage.setItem('kidroo_settings', JSON.stringify(fresh));
      setSettings(fresh);
    }
  }, [isSuccess, apiResponse]);

  // 4️⃣ Manual override (used by AdminSettings after a successful PUT)
  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      applyCssVars(updated);
      localStorage.setItem('kidroo_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
