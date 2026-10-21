import { useColorScheme } from 'react-native';
import { useAppStore, type ThemeMode } from '../store/useAppStore';
import { darkColors, lightColors, type ThemeColors } from './tokens';

export interface UseThemeResult {
  /** The user-selected mode: 'system' | 'dark' | 'light' */
  themeMode: ThemeMode;
  /** Update the selected theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** The actively applied theme: 'dark' | 'light' */
  resolvedTheme: 'dark' | 'light';
  /** The active theme color tokens */
  colors: ThemeColors;
  /** Whether the active theme is dark */
  isDark: boolean;
  /** Recommended status bar style ('light' | 'dark') */
  statusBarStyle: 'light' | 'dark';
}

/**
 * Hook providing reactive theme colors and switching controls across the app.
 */
export function useTheme(): UseThemeResult {
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const systemScheme = useColorScheme();

  const resolvedTheme: 'dark' | 'light' =
    themeMode === 'system'
      ? systemScheme === 'light'
        ? 'light'
        : 'dark'
      : themeMode;

  const colors = resolvedTheme === 'light' ? lightColors : darkColors;
  const isDark = resolvedTheme === 'dark';

  return {
    themeMode,
    setThemeMode,
    resolvedTheme,
    colors,
    isDark,
    statusBarStyle: isDark ? 'light' : 'dark',
  };
}
