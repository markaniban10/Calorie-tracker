import React, { createContext, useContext, useMemo } from 'react';

export const radius = { sm: 12, md: 18, pill: 999 };

// Font: Inter, bundled inside the app (works offline). Loaded in App.js.
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_800ExtraBold',
};

// Text size options shown in the sidebar
export const FONT_SCALES = [
  { key: 'small', label: 'S', scale: 0.88 },
  { key: 'default', label: 'M', scale: 1 },
  { key: 'large', label: 'L', scale: 1.15 },
  { key: 'xlarge', label: 'XL', scale: 1.3 },
];
export const DEFAULT_SCALE_KEY = 'default';

export const palettes = {
  light: {
    bg: '#F1F4F2',
    card: '#FFFFFF',
    ink: '#14212B',
    muted: '#5F6E78',
    line: '#E1E7E4',
    inputBg: '#F1F4F2',
    deficit: '#0F766E',
    deficitSoft: '#DDF1EE',
    surplus: '#B45309',
    surplusSoft: '#FBEBD5',
    danger: '#B42318',
    primary: '#14212B',
    onPrimary: '#FFFFFF',
    overlay: 'rgba(10,20,25,0.45)',
    statusBar: 'dark-content',
    shadow: {
      shadowColor: '#0B1A14',
      shadowOpacity: 0.07,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
  },
  dark: {
    bg: '#0E1512',
    card: '#17211C',
    ink: '#E8EFEC',
    muted: '#97A79F',
    line: '#27342D',
    inputBg: '#0E1512',
    deficit: '#3FD0BE',
    deficitSoft: '#143530',
    surplus: '#F5A524',
    surplusSoft: '#3A2B10',
    danger: '#FF7A70',
    primary: '#E8EFEC',
    onPrimary: '#0E1512',
    overlay: 'rgba(0,0,0,0.6)',
    statusBar: 'light-content',
    shadow: { elevation: 0 },
  },
};

const ThemeContext = createContext({
  colors: palettes.light,
  dark: false,
  toggleDark: () => {},
  scaleKey: DEFAULT_SCALE_KEY,
  setScaleKey: () => {},
  fs: (n) => n,
});

export function ThemeProvider({ dark, onToggle, scaleKey, onScaleChange, children }) {
  const value = useMemo(() => {
    const scale = (FONT_SCALES.find((f) => f.key === scaleKey) || FONT_SCALES[1]).scale;
    return {
      colors: dark ? palettes.dark : palettes.light,
      dark,
      toggleDark: onToggle,
      scaleKey,
      setScaleKey: onScaleChange,
      fs: (n) => Math.round(n * scale), // scales a font size / line height
    };
  }, [dark, onToggle, scaleKey, onScaleChange]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Usage: const s = useStyles(makeStyles);   makeStyles = (c, fs) => StyleSheet.create({...})
export function useStyles(make) {
  const { colors, fs } = useTheme();
  return useMemo(() => make(colors, fs), [colors, fs, make]);
}