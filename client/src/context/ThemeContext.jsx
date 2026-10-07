import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const getSavedTheme = () => {
  const saved = localStorage.getItem('rideshare-theme');
  return saved || 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme);
  const [textScale, setTextScale] = useState(Number(localStorage.getItem('rideshare-text-scale') || '1'));
  const [accent, setAccent] = useState(localStorage.getItem('rideshare-accent') || '#2563EB');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rideshare-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', accent);
    document.documentElement.style.setProperty('--primary-hover', accent === '#2563EB' ? '#1D4ED8' : accent);
    localStorage.setItem('rideshare-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(textScale));
    localStorage.setItem('rideshare-text-scale', String(textScale));
  }, [textScale]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent, textScale, setTextScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};
