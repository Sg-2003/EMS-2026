import { createContext, useContext, useState, useEffect } from 'react';

const AppearanceContext = createContext();

export const useAppearance = () => useContext(AppearanceContext);

const APPEARANCE_DEFAULTS = { theme: 'light', accent: 'indigo', density: 'comfortable' };

export const AppearanceProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('ems_appearance');
      return saved ? { ...APPEARANCE_DEFAULTS, ...JSON.parse(saved) } : APPEARANCE_DEFAULTS;
    } catch {
      return APPEARANCE_DEFAULTS;
    }
  });

  const updatePref = (key, value) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('ems_appearance', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    // Apply accent color
    root.setAttribute('data-accent', prefs.accent || 'indigo');

    // Apply display density
    root.setAttribute('data-density', prefs.density || 'comfortable');

    // Apply theme (light/dark/system)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if theme is set to 'system'
    const handleSystemChange = () => {
      if (prefs.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [prefs.theme, prefs.accent, prefs.density]);

  return (
    <AppearanceContext.Provider value={{ prefs, updatePref }}>
      {children}
    </AppearanceContext.Provider>
  );
};
