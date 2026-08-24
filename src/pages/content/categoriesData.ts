export interface Category {
  id: string;
  name: string;
  code: string;
  parent: string | null;
  use: boolean;
  desc: string;
  count: number;
  created: string;
  updated: string;
  locked: boolean;
}

export const MAX_DEPTH = 3;

export const CATEGORIES: Category[] = [
  { id: 'c01', name: '카테고리 01', code: 'CATEGORY_01', parent: null, use: true, desc: '', count: 0, created: '2025.11.02', updated: '2026.07.30', locked: true },
  { id: 'c011', name: '카테고리 01-1', code: 'CATEGORY_01_01', parent: 'c01', use: true, desc: '', count: 50, created: '2025.11.02', updated: '2026.08.03', locked: true },
  { id: 'c012', name: '카테고리 01-2', code: 'CATEGORY_01_02', parent: 'c01', use: false, desc: '내부 운영 정책상 특정 콘텐츠에만 사용하는 카테고리', count: 40, created: '2025.11.02', updated: '2026.08.11', locked: true },
  { id: 'c013', name: '카테고리 01-3', code: 'CATEGORY_01_03', parent: 'c01', use: true, desc: '', count: 30, created: '2026.01.14', updated: '2026.06.21', locked: false },
  { id: 'c02', name: '카테고리 02', code: 'CATEGORY_02', parent: null, use: true, desc: '', count: 0, created: '2025.11.02', updated: '2026.05.09', locked: true },
  { id: 'c021', name: '카테고리 02-1', code: 'CATEGORY_02_01', parent: 'c02', use: true, desc: '', count: 35, created: '2025.12.01', updated: '2026.07.02', locked: true },
  { id: 'c022', name: '카테고리 02-2', code: 'CATEGORY_02_02', parent: 'c02', use: true, desc: '', count: 45, created: '2025.12.01', updated: '2026.08.05', locked: false },
  { id: 'c03', name: '카테고리 03', code: 'CATEGORY_03', parent: null, use: true, desc: '', count: 15, created: '2026.02.18', updated: '2026.08.01', locked: false },
  { id: 'c031', name: '카테고리 03-1', code: 'CATEGORY_03_01', parent: 'c03', use: true, desc: '', count: 12, created: '2026.02.18', updated: '2026.07.18', locked: false },
  { id: 'c0311', name: '카테고리 03-1-1', code: 'CATEGORY_03_01_01', parent: 'c031', use: true, desc: '3 Depth 카테고리 — 하위 추가가 제한됩니다', count: 4, created: '2026.03.05', updated: '2026.07.18', locked: false },
  { id: 'c04', name: '카테고리 04', code: 'CATEGORY_04', parent: null, use: true, desc: '아직 콘텐츠가 연결되지 않은 신규 카테고리', count: 0, created: '2026.08.09', updated: '2026.08.09', locked: false },
];
