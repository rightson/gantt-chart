import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgInput: string;

  // Borders
  borderPrimary: string;
  borderSecondary: string;
  borderGrid: string;

  // Text
  textPrimary: string;
  textMuted: string;

  // Accent
  accent: string;

  // Buttons
  btnPrimary: string;
  btnSecondary: string;

  // Overlay
  overlayBg: string;
  modalShadow: string;

  // Zoom controls
  zoomBg: string;
}

const darkColors: ThemeColors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#1a1a2e',
  bgTertiary: '#16213e',
  bgInput: '#0d1117',
  borderPrimary: '#0f3460',
  borderSecondary: '#333',
  borderGrid: '#1c2333',
  textPrimary: '#e0e0ff',
  textMuted: '#8888aa',
  accent: '#0096c7',
  btnPrimary: '#0f3460',
  btnSecondary: '#333',
  overlayBg: 'rgba(0,0,0,0.6)',
  modalShadow: '0 20px 60px rgba(0,0,0,0.5)',
  zoomBg: 'rgba(22,33,62,0.9)',
};

const lightColors: ThemeColors = {
  bgPrimary: '#f5f6f8',
  bgSecondary: '#ffffff',
  bgTertiary: '#e8ecf1',
  bgInput: '#ffffff',
  borderPrimary: '#c0cfdf',
  borderSecondary: '#d0d7de',
  borderGrid: '#e0e4e8',
  textPrimary: '#1f2328',
  textMuted: '#656d76',
  accent: '#0078d4',
  btnPrimary: '#0078d4',
  btnSecondary: '#d0d7de',
  overlayBg: 'rgba(0,0,0,0.3)',
  modalShadow: '0 20px 60px rgba(0,0,0,0.15)',
  zoomBg: 'rgba(255,255,255,0.9)',
};

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveColors(mode: ThemeMode): ThemeColors {
  if (mode === 'system') {
    return getSystemDark() ? darkColors : lightColors;
  }
  return mode === 'dark' ? darkColors : lightColors;
}

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  /** Call when system preference changes */
  _refresh: () => void;
}

const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'dark';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: savedMode,
  colors: resolveColors(savedMode),

  setMode: (mode) => {
    localStorage.setItem('themeMode', mode);
    set({ mode, colors: resolveColors(mode) });
  },

  _refresh: () => {
    const { mode } = get();
    if (mode === 'system') {
      set({ colors: resolveColors('system') });
    }
  },
}));

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  useThemeStore.getState()._refresh();
});
