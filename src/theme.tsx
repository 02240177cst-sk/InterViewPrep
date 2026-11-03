import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const light = {
  bg: '#F6F7FB', card: '#FFFFFF', text: '#14213D', sub: '#6B7280',
  primary: '#4F46E5', onPrimary: '#FFFFFF', border: '#E5E7EB',
  danger: '#DC2626', success: '#16A34A',
};
export const dark = {
  bg: '#0F172A', card: '#1E293B', text: '#F1F5F9', sub: '#94A3B8',
  primary: '#818CF8', onPrimary: '#0F172A', border: '#334155',
  danger: '#F87171', success: '#4ADE80',
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