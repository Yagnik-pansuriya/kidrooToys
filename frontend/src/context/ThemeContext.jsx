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
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // Apply CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primaryColor);
    root.style.setProperty('--color-primary-light', settings.primaryLight);
    root.style.setProperty('--color-primary-dark', settings.primaryDark);
    root.style.setProperty('--color-secondary', settings.secondaryColor);
    root.style.setProperty('--color-secondary-light', settings.secondaryLight);
    root.style.setProperty('--color-secondary-dark', settings.secondaryDark);
    root.style.setProperty('--color-accent', settings.accentColor);
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
