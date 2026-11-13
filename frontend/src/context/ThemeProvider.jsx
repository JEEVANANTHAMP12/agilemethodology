import React, { useEffect, useState, useCallback } from 'react';
import { ThemeContext } from './themeContextDef';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('agile_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore storage access issues
  }
  return 'dark';
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('agile_theme', theme);
    } catch {
      // ignore storage access issues
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

