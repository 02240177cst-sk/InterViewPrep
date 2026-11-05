import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const light = {
  bg: '#F5F6FA', card: '#FFFFFF', text: '#0F172A', sub: '#64748B',
  primary: '#FF8C00', onPrimary: '#FFFFFF', primarySoft: '#EEF2FF', border: '#E2E8F0',
  danger: '#EF4444', success: '#10B981', warn: '#F59E0B',
};
export const dark = {
  bg: '#0B1120', card: '#151E32', text: '#F1F5F9', sub: '#94A3B8',
  primary: '#FF8C00', onPrimary: '#0B1120', primarySoft: '#1E2A4A', border: '#26324A',
  danger: '#F87171', success: '#34D399', warn: '#FBBF24',
};
export type Colors = typeof light;
type Mode = 'light' | 'dark';

const ThemeCtx = createContext<{ mode: Mode; colors: Colors; setMode: (m: Mode) => void }>({
  mode: 'light', colors: light, setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((v) => {
      if (v === 'dark' || v === 'light') setModeState(v);
    });
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem('theme', m);
  };

  return (
    <ThemeCtx.Provider value={{ mode, colors: mode === 'dark' ? dark : light, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);