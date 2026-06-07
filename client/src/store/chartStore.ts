import { create } from 'zustand';
import { ZoomLevel, ZOOM_LEVELS, getNextZoomIn, getNextZoomOut } from '../utils/date';

interface ChartState {
  scrollX: number;
  scrollY: number;
  zoomLevel: ZoomLevel;
  origin: Date;
  viewportWidth: number;
  viewportHeight: number;
  setScroll: (x: number, y: number) => void;
  setScrollX: (x: number) => void;
  setScrollY: (y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewport: (width: number, height: number) => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  scrollX: 0,
  scrollY: 0,
  zoomLevel: 'day',
  origin: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,

  setScroll: (x, y) => set({ scrollX: x, scrollY: y }),
  setScrollX: (x) => set({ scrollX: x }),
  setScrollY: (y) => set({ scrollY: y }),

  zoomIn: () => set((s) => ({ zoomLevel: getNextZoomIn(s.zoomLevel) })),
  zoomOut: () => set((s) => ({ zoomLevel: getNextZoomOut(s.zoomLevel) })),

  setViewport: (width, height) => set({ viewportWidth: width, viewportHeight: height }),
}));

export function getZoomConfig(level: ZoomLevel, viewportWidth?: number) {
  const config = ZOOM_LEVELS[level];
  if (level === '7day' && viewportWidth && viewportWidth > 0) {
    return { ...config, unitWidth: Math.floor(viewportWidth / 7) };
  }
  return config;
}
