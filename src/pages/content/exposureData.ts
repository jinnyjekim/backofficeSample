export interface ExposureArea {
  id: string;
  name: string;
  parent: string | null;
  use: boolean;
  max: number;
}

export interface ExposureEntry {
  id: string;
  ctid: string;
  on: boolean;
  pinned: boolean;
  start: string;
  end: string;
  author: string;
  updated: string;
}

export const AREAS: ExposureArea[] = [
  { id: 'ar01', name: '영역 01', parent: null, use: true, max: 10 },
  { id: 'ar011', name: '영역 01-1', parent: 'ar01', use: true, max: 8 },
  { id: 'ar012', name: '영역 01-2', parent: 'ar01', use: true, max: 12 },
  { id: 'ar02', name: '영역 02', parent: null, use: true, max: 20 },
  { id: 'ar021', name: '영역 02-1', parent: 'ar02', use: true, max: 10 },
  { id: 'ar022', name: '영역 02-2', parent: 'ar02', use: false, max: 10 },
  { id: 'ar03', name: '영역 03', parent: null, use: true, max: 6 },
];

export const EXPOSURE_DATA: Record<string, ExposureEntry[]> = {
  ar011: [
    { id: 'e1', ctid: 'C10284', on: true, pinned: true, start: '2026-08-01T09:00', end: '', author: 'admin01', updated: '2026.08.10 14:20' },
    { id: 'e2', ctid: 'C10283', on: true, pinned: false, start: '2026-08-05T00:00', end: '', author: 'admin01', updated: '2026.08.09 10:02' },
    { id: 'e3', ctid: 'C10281', on: true, pinned: false, start: '2026-08-20T00:00', end: '2026-08-27T23:59', author: 'admin02', updated: '2026.08.12 09:40' },
    { id: 'e4', ctid: 'C10278', on: false, pinned: false, start: '2026-07-28T00:00', end: '', author: 'admin01', updated: '2026.08.02 16:11' },
  ],
  ar02: [
    { id: 'e5', ctid: 'C10271', on: true, pinned: false, start: '2026-07-20T00:00', end: '', author: 'admin02', updated: '2026.08.05 11:00' },
    { id: 'e6', ctid: 'C10264', on: true, pinned: false, start: '2026-07-01T00:00', end: '2026-08-01T23:59', author: 'admin01', updated: '2026.07.30 09:12' },
    { id: 'e7', ctid: 'C10255', on: true, pinned: false, start: '2026-07-10T00:00', end: '', author: 'admin02', updated: '2026.07.15 13:20' },
  ],
};
