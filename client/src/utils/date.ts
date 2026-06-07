import {
  startOfDay, addDays, differenceInDays, differenceInHours,
  format, startOfWeek, startOfMonth, addMonths, addWeeks,
  addHours, differenceInMinutes,
} from 'date-fns';

export type ZoomLevel = 'halfhour' | 'hour' | 'day' | '7day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year' | 'multiyear';

export interface ZoomConfig {
  level: ZoomLevel;
  unitWidth: number;        // pixels per unit
  headerFormat: string;
  subHeaderFormat?: string;
}

// Each zoom level defines how wide one "unit" is and the label format
export const ZOOM_LEVELS: Record<ZoomLevel, ZoomConfig> = {
  halfhour:  { level: 'halfhour',  unitWidth: 60,  headerFormat: 'HH:mm', subHeaderFormat: 'MMM d' },
  hour:      { level: 'hour',      unitWidth: 60,  headerFormat: 'HH:00', subHeaderFormat: 'MMM d' },
  day:       { level: 'day',       unitWidth: 120, headerFormat: 'd',     subHeaderFormat: 'MMM yyyy' },
  '7day':    { level: '7day',     unitWidth: 200, headerFormat: 'EEE d', subHeaderFormat: 'MMM yyyy' },
  week:      { level: 'week',      unitWidth: 100, headerFormat: "'W'w",  subHeaderFormat: 'MMM yyyy' },
  month:     { level: 'month',     unitWidth: 120, headerFormat: 'MMM',   subHeaderFormat: 'yyyy' },
  quarter:   { level: 'quarter',   unitWidth: 100, headerFormat: "'Q'Q",  subHeaderFormat: 'yyyy' },
  halfyear:  { level: 'halfyear',  unitWidth: 120, headerFormat: "'H'H",  subHeaderFormat: 'yyyy' },
  year:      { level: 'year',      unitWidth: 120, headerFormat: 'yyyy' },
  multiyear: { level: 'multiyear', unitWidth: 60,  headerFormat: 'yyyy' },
};

const ZOOM_ORDER: ZoomLevel[] = ['halfhour', 'hour', 'day', '7day', 'week', 'month', 'quarter', 'halfyear', 'year', 'multiyear'];

export function getNextZoomIn(current: ZoomLevel): ZoomLevel {
  const idx = ZOOM_ORDER.indexOf(current);
  return idx > 0 ? ZOOM_ORDER[idx - 1] : current;
}

export function getNextZoomOut(current: ZoomLevel): ZoomLevel {
  const idx = ZOOM_ORDER.indexOf(current);
  return idx < ZOOM_ORDER.length - 1 ? ZOOM_ORDER[idx + 1] : current;
}

export function dateToX(date: Date, origin: Date, zoom: ZoomConfig): number {
  switch (zoom.level) {
    case 'halfhour':
      return (differenceInMinutes(date, origin) / 30) * zoom.unitWidth;
    case 'hour':
      return (differenceInMinutes(date, origin) / 60) * zoom.unitWidth;
    case 'day':
    case '7day':
      return differenceInDays(date, origin) * zoom.unitWidth;
    case 'week':
      return (differenceInDays(date, origin) / 7) * zoom.unitWidth;
    case 'month':
      return (differenceInDays(date, origin) / 30) * zoom.unitWidth;
    case 'quarter':
      return (differenceInDays(date, origin) / 91) * zoom.unitWidth;
    case 'halfyear':
      return (differenceInDays(date, origin) / 182) * zoom.unitWidth;
    case 'year':
      return (differenceInDays(date, origin) / 365) * zoom.unitWidth;
    case 'multiyear':
      return (differenceInDays(date, origin) / 365) * zoom.unitWidth;
  }
}

export function xToDate(x: number, origin: Date, zoom: ZoomConfig): Date {
  switch (zoom.level) {
    case 'halfhour':
      return addHours(origin, (x / zoom.unitWidth) * 0.5);
    case 'hour':
      return addHours(origin, x / zoom.unitWidth);
    case 'day':
    case '7day':
      return addDays(origin, x / zoom.unitWidth);
    case 'week':
      return addDays(origin, (x / zoom.unitWidth) * 7);
    case 'month':
      return addDays(origin, (x / zoom.unitWidth) * 30);
    case 'quarter':
      return addDays(origin, (x / zoom.unitWidth) * 91);
    case 'halfyear':
      return addDays(origin, (x / zoom.unitWidth) * 182);
    case 'year':
      return addDays(origin, (x / zoom.unitWidth) * 365);
    case 'multiyear':
      return addDays(origin, (x / zoom.unitWidth) * 365);
  }
}

export interface TimelineUnit {
  date: Date;
  label: string;
  x: number;
  width: number;
}

export function generateTimelineUnits(
  origin: Date,
  scrollX: number,
  viewportWidth: number,
  zoom: ZoomConfig,
): TimelineUnit[] {
  const units: TimelineUnit[] = [];
  const startDate = xToDate(scrollX - zoom.unitWidth, origin, zoom);
  const endDate = xToDate(scrollX + viewportWidth + zoom.unitWidth, origin, zoom);

  let current: Date;
  let step: (d: Date) => Date;

  switch (zoom.level) {
    case 'halfhour':
      current = new Date(startDate);
      current.setMinutes(Math.floor(current.getMinutes() / 30) * 30, 0, 0);
      step = (d) => addHours(d, 0.5);
      break;
    case 'hour':
      current = new Date(startDate);
      current.setMinutes(0, 0, 0);
      step = (d) => addHours(d, 1);
      break;
    case 'day':
    case '7day':
      current = startOfDay(startDate);
      step = (d) => addDays(d, 1);
      break;
    case 'week':
      current = startOfWeek(startDate, { weekStartsOn: 1 });
      step = (d) => addWeeks(d, 1);
      break;
    case 'month':
      current = startOfMonth(startDate);
      step = (d) => addMonths(d, 1);
      break;
    case 'quarter':
      current = startOfMonth(startDate);
      current.setMonth(Math.floor(current.getMonth() / 3) * 3);
      step = (d) => addMonths(d, 3);
      break;
    case 'halfyear':
      current = startOfMonth(startDate);
      current.setMonth(Math.floor(current.getMonth() / 6) * 6);
      step = (d) => addMonths(d, 6);
      break;
    case 'year':
      current = new Date(startDate.getFullYear(), 0, 1);
      step = (d) => new Date(d.getFullYear() + 1, 0, 1);
      break;
    case 'multiyear':
      current = new Date(startDate.getFullYear(), 0, 1);
      step = (d) => new Date(d.getFullYear() + 1, 0, 1);
      break;
  }

  while (current <= endDate) {
    const next = step(current);
    const x = dateToX(current, origin, zoom);
    const nextX = dateToX(next, origin, zoom);

    let label: string;
    try {
      label = format(current, zoom.headerFormat);
    } catch {
      label = current.toLocaleDateString();
    }

    units.push({ date: new Date(current), label, x, width: nextX - x });
    current = next;
  }

  return units;
}

export function generateSubHeaders(
  origin: Date,
  scrollX: number,
  viewportWidth: number,
  zoom: ZoomConfig,
): TimelineUnit[] {
  if (!zoom.subHeaderFormat) return [];

  const units: TimelineUnit[] = [];
  const startDate = xToDate(scrollX - 200, origin, zoom);
  const endDate = xToDate(scrollX + viewportWidth + 200, origin, zoom);

  let current: Date;
  let step: (d: Date) => Date;

  switch (zoom.level) {
    case 'halfhour':
    case 'hour':
      current = startOfDay(startDate);
      step = (d) => addDays(d, 1);
      break;
    case 'day':
    case '7day':
      current = startOfMonth(startDate);
      step = (d) => addMonths(d, 1);
      break;
    case 'week':
      current = startOfMonth(startDate);
      step = (d) => addMonths(d, 1);
      break;
    case 'month':
    case 'quarter':
    case 'halfyear':
      current = new Date(startDate.getFullYear(), 0, 1);
      step = (d) => new Date(d.getFullYear() + 1, 0, 1);
      break;
    default:
      return [];
  }

  while (current <= endDate) {
    const next = step(current);
    const x = dateToX(current, origin, zoom);
    const nextX = dateToX(next, origin, zoom);

    let label: string;
    try {
      label = format(current, zoom.subHeaderFormat!);
    } catch {
      label = '';
    }

    units.push({ date: new Date(current), label, x, width: nextX - x });
    current = next;
  }

  return units;
}
