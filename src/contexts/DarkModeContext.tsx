import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DarkModeContextType {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme-dark');
    if (stored) return stored === '1';
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme-dark', dark ? '1' : '0');
  }, [dark]);

  const toggle = () => setDarkState((v) => !v);

  return (
    <DarkModeContext.Provider value={{ dark, toggle, setDark: setDarkState }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) throw new Error('useDarkMode must be used within DarkModeProvider');
  return context;
}
