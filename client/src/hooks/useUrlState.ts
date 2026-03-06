import { useEffect, useRef } from 'react';
import { useChartStore } from '../store/chartStore';
import { useProjectStore } from '../store/projectStore';
import { dateToX, xToDate, ZOOM_LEVELS, ZoomLevel } from '../utils/date';

const ZOOM_LEVEL_KEYS = Object.keys(ZOOM_LEVELS) as ZoomLevel[];

function isValidZoom(v: string): v is ZoomLevel {
  return ZOOM_LEVEL_KEYS.includes(v as ZoomLevel);
}

/**
 * Two-way sync between URL search params and chart/project state.
 *
 * URL params:
 *   project  – project id
 *   zoom     – zoom level name
 *   date     – ISO date string of the viewport center
 *   sy       – vertical scroll (px)
 */
export function useUrlState() {
  const initialized = useRef(false);
  const suppressUrlUpdate = useRef(false);

  // ── Read URL → apply to stores (once, on mount) ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const projectId = params.get('project');
    const zoomParam = params.get('zoom');
    const dateParam = params.get('date');
    const syParam = params.get('sy');

    const store = useChartStore.getState();

    // Zoom
    let zoomLevel = store.zoomLevel;
    if (zoomParam && isValidZoom(zoomParam)) {
      zoomLevel = zoomParam;
    }

    // Vertical scroll
    let scrollY = store.scrollY;
    if (syParam != null) {
      const n = Number(syParam);
      if (Number.isFinite(n) && n >= 0) scrollY = n;
    }

    // Horizontal scroll derived from center date
    let scrollX = store.scrollX;
    if (dateParam) {
      const centerDate = new Date(dateParam);
      if (!isNaN(centerDate.getTime())) {
        const zoom = ZOOM_LEVELS[zoomLevel];
        const x = dateToX(centerDate, store.origin, zoom);
        scrollX = x - store.viewportWidth / 2;
      }
    }

    // Apply chart state in one batch
    suppressUrlUpdate.current = true;
    useChartStore.setState({ zoomLevel, scrollX, scrollY });

    // Project – apply after projects are fetched
    if (projectId) {
      const applyProject = () => {
        const { projects, currentProject, setCurrentProject } = useProjectStore.getState();
        if (currentProject?.id === projectId) return true;
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          setCurrentProject(found);
          return true;
        }
        return false;
      };

      // Projects might not be loaded yet; subscribe and wait
      if (!applyProject()) {
        const unsub = useProjectStore.subscribe(() => {
          if (applyProject()) unsub();
        });
      }
    }

    // Allow URL updates after a tick so the initial state doesn't
    // immediately rewrite the URL (which is already correct).
    requestAnimationFrame(() => {
      suppressUrlUpdate.current = false;
      initialized.current = true;
    });
  }, []); // run once

  // ── Write stores → URL (on every relevant change) ────────────────────
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const updateUrl = () => {
      if (suppressUrlUpdate.current) return;

      const { scrollX, scrollY, zoomLevel, origin, viewportWidth } = useChartStore.getState();
      const { currentProject } = useProjectStore.getState();

      const zoom = ZOOM_LEVELS[zoomLevel];
      const centerDate = xToDate(scrollX + viewportWidth / 2, origin, zoom);

      const params = new URLSearchParams();
      if (currentProject) params.set('project', currentProject.id);
      params.set('zoom', zoomLevel);
      params.set('date', centerDate.toISOString());
      if (scrollY > 0) params.set('sy', String(Math.round(scrollY)));

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      if (newUrl !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(null, '', newUrl);
      }
    };

    unsubs.push(useChartStore.subscribe(updateUrl));
    unsubs.push(useProjectStore.subscribe(updateUrl));

    return () => unsubs.forEach((u) => u());
  }, []);
}
