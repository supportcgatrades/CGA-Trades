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
  // Device/system theme is ALWAYS the authoritative default on fresh load/refresh
  // No persistence in localStorage, sessionStorage, cookies, IndexedDB, or database.
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    // Clear any legacy persisted keys so reload always strictly honors device theme
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('theme');
        sessionStorage.removeItem('theme');
      } catch {}
    }
    return getSystemTheme();
  });

  // Track if user explicitly toggled during this runtime session
  const [isManualOverride, setIsManualOverride] = useState(false);

  const theme: ThemePreference = isManualOverride ? effectiveTheme : 'system';

  // Manual theme setter (runtime override only for current session)
  const setTheme = useCallback((newTheme: ThemePreference) => {
    if (newTheme === 'system') {
      setIsManualOverride(false);
      const sys = getSystemTheme();
      setEffectiveTheme(sys);
      applyThemeClasses(sys);
    } else {
      setIsManualOverride(true);
      setEffectiveTheme(newTheme);
      applyThemeClasses(newTheme);
    }
  }, []);

  // Manual toggle (runtime override only for current session)
  const toggleTheme = useCallback(() => {
    setIsManualOverride(true);
    setEffectiveTheme((prev) => {
      const next: EffectiveTheme = prev === 'dark' ? 'light' : 'dark';
      applyThemeClasses(next);
      return next;
    });
  }, []);

  // Synchronize theme classes on mount
  useEffect(() => {
    applyThemeClasses(effectiveTheme);
  }, [effectiveTheme]);

  // Listen for device / system appearance changes live while app is running
  // Automatically updates the application immediately when device theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newEffective: EffectiveTheme = e.matches ? 'dark' : 'light';
      // Device theme changes take immediate effect
      setIsManualOverride(false);
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

