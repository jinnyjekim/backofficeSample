import type { ContentBusinessType } from './contentBusiness';

export interface ExposureArea {
  id: string;
  businessType: ContentBusinessType;
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
  { id: 'b2chome', businessType: 'B2C', name: '쇼핑 홈', parent: null, use: true, max: 20 },
  { id: 'b2chero', businessType: 'B2C', name: '히어로 배너', parent: 'b2chome', use: true, max: 8 },
  { id: 'b2cplan', businessType: 'B2C', name: '기획전 추천', parent: 'b2chome', use: true, max: 12 },
  { id: 'c2cexplore', businessType: 'C2C', name: '탐색', parent: null, use: true, max: 20 },
  { id: 'c2crecommend', businessType: 'C2C', name: '추천 피드', parent: 'c2cexplore', use: true, max: 10 },
  { id: 'c2ccommunity', businessType: 'C2C', name: '커뮤니티 인기글', parent: 'c2cexplore', use: true, max: 10 },
  { id: 'b2bportal', businessType: 'B2B', name: '거래처 포털', parent: null, use: true, max: 16 },
  { id: 'b2bnotice', businessType: 'B2B', name: '주요 공지', parent: 'b2bportal', use: true, max: 8 },
  { id: 'b2bdocs', businessType: 'B2B', name: '업무 자료', parent: 'b2bportal', use: true, max: 12 },
];

export const EXPOSURE_DATA: Record<string, ExposureEntry[]> = {
  b2chero: [
    { id: 'e1', ctid: 'C10284', on: true, pinned: true, start: '2026-08-01T09:00', end: '', author: 'admin01', updated: '2026.08.10 14:20' },
    { id: 'e2', ctid: 'C10281', on: true, pinned: false, start: '2026-08-20T00:00', end: '2026-08-27T23:59', author: 'admin02', updated: '2026.08.12 09:40' },
  ],
  b2cplan: [
    { id: 'e3', ctid: 'C10264', on: true, pinned: false, start: '2026-07-01T00:00', end: '', author: 'admin01', updated: '2026.08.08 09:12' },
  ],
  c2crecommend: [
    { id: 'e4', ctid: 'C10271', on: true, pinned: true, start: '2026-07-20T00:00', end: '', author: 'admin02', updated: '2026.08.05 11:00' },
    { id: 'e5', ctid: 'C10259', on: true, pinned: false, start: '2026-07-10T00:00', end: '', author: 'admin02', updated: '2026.08.07 13:20' },
  ],
  c2ccommunity: [
    { id: 'e6', ctid: 'C10278', on: false, pinned: false, start: '2026-08-09T00:00', end: '', author: 'admin01', updated: '2026.08.11 16:11' },
  ],
  b2bnotice: [
    { id: 'e7', ctid: 'C10283', on: true, pinned: true, start: '2026-08-15T09:00', end: '', author: 'partner-admin', updated: '2026.08.12 10:02' },
  ],
  b2bdocs: [
    { id: 'e8', ctid: 'C10250', on: true, pinned: false, start: '2026-08-05T00:00', end: '', author: 'b2b-admin', updated: '2026.08.05 15:20' },
    { id: 'e9', ctid: 'C10244', on: true, pinned: false, start: '2026-08-01T00:00', end: '', author: 'b2b-admin', updated: '2026.08.03 11:40' },
  ],
};
