import { PRODUCTS } from '../products/productsData';

export type BrandStatus = '사용중' | '미사용';

export const TODAY = '2026-08-26';
export const OWNERS = ['admin01', 'admin02', 'admin03'];

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  status: BrandStatus;
  exposure: boolean;
  exposureOrder: number;
  hasLogo: boolean;
  description: string;
  productCodes: string[];
  owner: string;
  memos: Memo[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
}

export const STATUS_META: Record<BrandStatus, { bg: string; fg: string }> = {
  사용중: { bg: '#ecfdf5', fg: '#059669' },
  미사용: { bg: '#f4f4f5', fg: '#71717a' },
};

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function productStatus(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.status ?? '-';
}

export function computeIssues(b: Brand, all: Brand[]): string[] {
  const issues: string[] = [];
  if (all.some((o) => o.id !== b.id && o.name === b.name)) issues.push('브랜드명이 중복됩니다.');
  if (all.some((o) => o.id !== b.id && o.code === b.code)) issues.push('브랜드 코드가 중복됩니다.');
  if (b.status === '미사용' && b.productCodes.some((code) => productStatus(code) === '판매중')) {
    issues.push('미사용 브랜드에 판매중 상품이 연결되어 있습니다.');
  }
  return issues;
}

export type QuickFilter = '전체' | '사용중' | '미사용' | '비노출' | '상품 미연결';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '사용중', '미사용', '비노출', '상품 미연결'];

export function matchesQuickFilter(b: Brand, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '사용중') return b.status === '사용중';
  if (filter === '미사용') return b.status === '미사용';
  if (filter === '비노출') return !b.exposure;
  return b.productCodes.length === 0;
}

function nextId(list: Brand[]): string {
  const maxSeq = list.reduce((max, b) => {
    const n = parseInt(b.id.replace('BR-', ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `BR-${String(maxSeq + 1).padStart(5, '0')}`;
}

export function newBrand(list: Brand[]): Brand {
  const maxOrder = list.reduce((max, b) => Math.max(max, b.exposureOrder), 0);
  return {
    id: nextId(list),
    code: '',
    name: '',
    status: '사용중',
    exposure: true,
    exposureOrder: maxOrder + 10,
    hasLogo: false,
    description: '',
    productCodes: [],
    owner: OWNERS[0],
    memos: [],
    createdAt: TODAY,
    updatedAt: TODAY,
    updatedBy: OWNERS[0],
    history: [],
  };
}

export const BRANDS: Brand[] = [
  {
    id: 'BR-00001', code: 'BRAND01', name: '브랜드01', status: '사용중', exposure: true, exposureOrder: 10,
    hasLogo: true, description: '대표 프리미엄 라인업을 운영하는 자체 브랜드입니다.',
    productCodes: ['P-001238', 'P-001240'], owner: 'admin01', memos: [],
    createdAt: '2026-05-01', updatedAt: '2026-08-26', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-05-01 09:00', by: 'admin01', action: '브랜드 등록' }],
  },
  {
    id: 'BR-00002', code: 'BRAND02', name: '브랜드02', status: '사용중', exposure: false, exposureOrder: 20,
    hasLogo: true, description: '시즌 한정 컬렉션 브랜드입니다.',
    productCodes: ['P-001239'], owner: 'admin02', memos: [],
    createdAt: '2026-05-10', updatedAt: '2026-08-24', updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-05-10 09:00', by: 'admin02', action: '브랜드 등록' },
      { id: 'H-2', at: '2026-08-24 11:00', by: 'admin02', action: '노출 상태 변경', before: '노출', after: '비노출' },
    ],
  },
  {
    id: 'BR-00003', code: 'BRAND03', name: '브랜드03', status: '미사용', exposure: false, exposureOrder: 30,
    hasLogo: false, description: '',
    productCodes: [], owner: 'admin02', memos: [],
    createdAt: '2026-06-01', updatedAt: '2026-08-20', updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-06-01 09:00', by: 'admin02', action: '브랜드 등록' },
      { id: 'H-2', at: '2026-08-20 10:00', by: 'admin02', action: '미사용 처리' },
    ],
  },
  {
    id: 'BR-00004', code: 'BRAND04', name: '브랜드04', status: '사용중', exposure: true, exposureOrder: 40,
    hasLogo: true, description: '생활 잡화 전문 브랜드입니다.',
    productCodes: ['P-001241'], owner: 'admin03', memos: [],
    createdAt: '2026-06-15', updatedAt: '2026-08-10', updatedBy: 'admin03',
    history: [{ id: 'H-1', at: '2026-06-15 09:00', by: 'admin03', action: '브랜드 등록' }],
  },
  {
    id: 'BR-00005', code: 'BRAND04', name: '브랜드05', status: '사용중', exposure: true, exposureOrder: 50,
    hasLogo: false, description: '테스트 목적으로 등록된 브랜드입니다.',
    productCodes: [], owner: 'admin01', memos: [{ id: 'M-1', at: '2026-08-26 09:00', by: 'admin02', text: '브랜드04와 코드가 중복됩니다. 확인 필요.' }],
    createdAt: '2026-07-01', updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-07-01 09:00', by: 'admin01', action: '브랜드 등록' }],
  },
  {
    id: 'BR-00006', code: 'BRAND06', name: '브랜드05', status: '미사용', exposure: false, exposureOrder: 60,
    hasLogo: false, description: '단종된 브랜드입니다.',
    productCodes: ['P-000982'], owner: 'admin03', memos: [{ id: 'M-1', at: '2026-08-26 09:05', by: 'admin02', text: '브랜드05와 이름이 중복됩니다. 확인 필요.' }],
    createdAt: '2026-04-01', updatedAt: '2026-08-15', updatedBy: 'admin03',
    history: [
      { id: 'H-1', at: '2026-04-01 09:00', by: 'admin03', action: '브랜드 등록' },
      { id: 'H-2', at: '2026-08-15 09:00', by: 'admin03', action: '미사용 처리' },
    ],
  },
];
