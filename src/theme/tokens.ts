/**
 * Design tokens for the app.
 *
 * Douyin's dark theme is essentially pure black chrome around full-bleed
 * video, with two brand accents (red + cyan) used sparingly.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  brand: string;
  brandCyan: string;
  divider: string;
  cardBorder: string;
  overlay: string;
  scrim: string;
  tabBarBg: string;
  tabBarInactive: string;
  tabBarActive: string;
  statusBarStyle: 'light' | 'dark';
  isDark: boolean;
}

export const darkColors: ThemeColors = {
  /** Page background behind the video feed. */
  background: '#000000',
  /** Raised surfaces: sheets, cards, tab bar. */
  surface: '#161823',
  /** Slightly lighter surface for pressed states / inputs. */
  surfaceMuted: '#22242F',
  surfaceSubtle: '#1C1E2A',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.78)',
  textTertiary: 'rgba(255, 255, 255, 0.48)',

  /** Douyin's signature rose red — likes, active tabs, badges. */
  brand: '#FE2C55',
  /** The cyan half of the logo; used for the music disc and highlights. */
  brandCyan: '#25F4EE',

  divider: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.65)',

  tabBarBg: 'rgba(0, 0, 0, 0.90)',
  tabBarInactive: 'rgba(255, 255, 255, 0.55)',
  tabBarActive: '#FFFFFF',
  statusBarStyle: 'light',
  isDark: true,
};

export const lightColors: ThemeColors = {
  background: '#F8F8F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F1F3',
  surfaceSubtle: '#E8E8ED',

  textPrimary: '#161823',
  textSecondary: 'rgba(22, 24, 35, 0.75)',
  textTertiary: 'rgba(22, 24, 35, 0.45)',

  brand: '#FE2C55',
  brandCyan: '#25F4EE',

  divider: 'rgba(0, 0, 0, 0.06)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.35)',

  tabBarBg: 'rgba(255, 255, 255, 0.96)',
  tabBarInactive: 'rgba(22, 24, 35, 0.50)',
  tabBarActive: '#161823',
  statusBarStyle: 'dark',
  isDark: false,
};

/** Default backwards-compatible colors */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 14,
  body: 15,
  title: 17,
  heading: 20,
} as const;

/** Standard gutter for screen content, matching the feed's left rail. */
export const SCREEN_PADDING = 16;

/** Height of the custom tab bar, excluding the safe-area inset. */
export const TAB_BAR_HEIGHT = 52;
