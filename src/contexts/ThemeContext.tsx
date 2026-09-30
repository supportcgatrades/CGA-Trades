import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  effectiveTheme: EffectiveTheme;
  isDark: boolean;
  isLight: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClasses(effective: EffectiveTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Device/system theme is the authoritative theme
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    return getSystemTheme();
  });

  const [theme, setThemeState] = useState<ThemePreference>('system');

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    // If explicit preference provided, update state for compatibility while maintaining system responsiveness
    if (newTheme === 'system') {
      const sys = getSystemTheme();
      setEffectiveTheme(sys);
      applyThemeClasses(sys);
    } else {
      setEffectiveTheme(newTheme);
      applyThemeClasses(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [effectiveTheme, setTheme]);

  // Synchronize on mount and apply classes immediately
  useEffect(() => {
    const current = getSystemTheme();
    setEffectiveTheme(current);
    applyThemeClasses(current);
  }, []);

  // Listen for device / system appearance changes live while app is running
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Immediate sync
    const initial = mediaQuery.matches ? 'dark' : 'light';
    setEffectiveTheme(initial);
    applyThemeClasses(initial);

    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newEffective: EffectiveTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newEffective);
      applyThemeClasses(newEffective);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        isDark: effectiveTheme === 'dark',
        isLight: effectiveTheme === 'light',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
