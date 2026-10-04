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

function getInitialTheme(): { effective: EffectiveTheme; explicit: 'light' | 'dark' | null } {
  const systemTheme = getSystemTheme();
  if (typeof window === 'undefined') {
    return { effective: systemTheme, explicit: null };
  }
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return { effective: saved, explicit: saved };
    }
  } catch (e) {
    console.warn("Theme storage read warning:", e);
  }
  return { effective: systemTheme, explicit: null };
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
  // Device/system theme is the default when no explicit choice has been made
  const [initial] = useState(() => getInitialTheme());
  const [explicitPreference, setExplicitPreference] = useState<'light' | 'dark' | null>(initial.explicit);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(initial.effective);

  const theme: ThemePreference = explicitPreference || 'system';

  const setTheme = useCallback((newTheme: ThemePreference) => {
    if (newTheme === 'system') {
      setExplicitPreference(null);
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch (e) {}
      const sys = getSystemTheme();
      setEffectiveTheme(sys);
      applyThemeClasses(sys);
    } else {
      setExplicitPreference(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {}
      setEffectiveTheme(newTheme);
      applyThemeClasses(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setEffectiveTheme((prev) => {
      const next: EffectiveTheme = prev === 'dark' ? 'light' : 'dark';
      setExplicitPreference(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {}
      applyThemeClasses(next);
      return next;
    });
  }, []);

  // Synchronize initial theme classes on mount
  useEffect(() => {
    applyThemeClasses(effectiveTheme);
  }, []);

  // Listen for device / system appearance changes live while app is running
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      let hasExplicit = false;
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        hasExplicit = saved === 'light' || saved === 'dark';
      } catch {}

      // If no explicit preference has been saved by the user, follow system theme changes live
      if (!hasExplicit) {
        const newEffective: EffectiveTheme = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEffective);
        applyThemeClasses(newEffective);
      }
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
