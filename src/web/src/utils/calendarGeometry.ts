import { DAY_START_MINUTES, DAY_END_MINUTES } from "../types/timetable";

export const WINDOW_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES;
export const SnapMinutes = 15;
export const GRID_HEIGHT_PX =600;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function snapMinutes(
  minutes: number,
  snap: number = SnapMinutes,
): number {
  return Math.round(minutes / snap) * snap;
}

export function pixelToMinutes(
  offsetY: number,
  columnHeightPx: number,
): number {
  const height = columnHeightPx > 0 ? columnHeightPx : 600;
  const fraction = clamp(offsetY / height, 0, 1);
  const rawMinutes = DAY_START_MINUTES + fraction * WINDOW_MINUTES;
  return clamp(snapMinutes(rawMinutes), DAY_START_MINUTES, DAY_END_MINUTES);
}

export function minutesToTopPercent(minutes: number): number {
  return ((minutes - DAY_START_MINUTES) / WINDOW_MINUTES) * 100;
}

export function minutesToHeightPercent(durationMinutes: number): number {
  return (durationMinutes / WINDOW_MINUTES) * 100;
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
