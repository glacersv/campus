import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemePalette = 'salesiano' | 'oceano' | 'violeta' | 'noche';

interface ThemePaletteColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  danger: string;
  label: string;
  icon: string;
}

const PALETTES: Record<ThemePalette, ThemePaletteColors> = {
  salesiano: {
    primary: '#12562E', primaryDark: '#0A391D', primaryLight: '#E8F5E9',
    secondary: '#FAB700', secondaryDark: '#D99E00', accent: '#0D71B9', danger: '#D32F2F',
    label: 'Salesiano', icon: '🌿'
  },
  oceano: {
    primary: '#0D4F6B', primaryDark: '#083247', primaryLight: '#E3F2F9',
    secondary: '#00B4D8', secondaryDark: '#0096B0', accent: '#0077B6', danger: '#E63946',
    label: 'Oceano', icon: '🌊'
  },
  violeta: {
    primary: '#5B2A8C', primaryDark: '#3D1A5E', primaryLight: '#F3E8FF',
    secondary: '#E879F9', secondaryDark: '#C026D3', accent: '#7C3AED', danger: '#BE123C',
    label: 'Violeta', icon: '💜'
  },
  noche: {
    primary: '#1E293B', primaryDark: '#0F172A', primaryLight: '#F1F5F9',
    secondary: '#F59E0B', secondaryDark: '#D97706', accent: '#3B82F6', danger: '#EF4444',
    label: 'Noche', icon: '🌙'
  }
};

interface ThemeContextType {
  palette: ThemePalette;
  colors: ThemePaletteColors;
  setPalette: (p: ThemePalette) => void;
  palettes: typeof PALETTES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<ThemePalette>(() => {
    return (localStorage.getItem('theme-palette') as ThemePalette) || 'salesiano';
  });

  const colors = PALETTES[palette];

  useEffect(() => {
    localStorage.setItem('theme-palette', palette);
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-secondary-dark', colors.secondaryDark);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-danger', colors.danger);
    root.style.setProperty('--color-primary-rgb', hexToRgb(colors.primary));
  }, [palette, colors]);

  return (
    <ThemeContext.Provider value={{ palette, colors, setPalette, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '18, 86, 46';
}
