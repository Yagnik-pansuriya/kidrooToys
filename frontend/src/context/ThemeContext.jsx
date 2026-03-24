import { createContext, useContext, useState, useEffect } from 'react';
import { siteSettings as defaultSettings } from '../mock/users';

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('kidroo_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old settings format to new simplified format
      return {
        ...defaultSettings,
        ...parsed,
        // Map old fields to new ones if present
        hoverColor: parsed.hoverColor || parsed.primaryDark || defaultSettings.hoverColor,
        headerColor: parsed.headerColor || defaultSettings.headerColor,
        footerColor: parsed.footerColor || defaultSettings.footerColor,
      };
    }
    return defaultSettings;
  });

  // Apply CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primaryColor);
    root.style.setProperty('--color-hover', settings.hoverColor);
    root.style.setProperty('--color-header', settings.headerColor);
    root.style.setProperty('--color-footer', settings.footerColor);
    localStorage.setItem('kidroo_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
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
