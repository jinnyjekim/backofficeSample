export type SupplyPriceStatus = '적용중' | '적용예정' | '종료' | '가격 미설정';
export type PriceType = '기본 공급가' | '거래처별 공급가' | '수량구간 공급가' | '계약 공급가';

export interface PriceTier {
  range: string;
  price: string;
}

export interface PriceContract {
  no: string;
  period: string;
  price: string;
}

export interface PriceHistoryEntry {
  when: string;
  admin: string;
  from: string;
  to: string;
  applyDate: string;
  reason: string;
}

export interface PriceScheduled {
  price: number;
  period: string;
}

export interface SupplyPrice {
  id: string;
  code: string;
  name: string;
  priceType: PriceType;
  target: string;
  basePrice: number;
  price: number;
  minQty: number | null;
  currency: string;
  period: string;
  start: string;
  end: string | null;
  status: SupplyPriceStatus;
  priority: number;
  updated: string;
  registered: string;
  admin: string;
  cost: number;
  hasTiers: boolean;
  tiers: PriceTier[];
  contract: PriceContract | null;
  history: PriceHistoryEntry[];
  scheduled?: PriceScheduled;
}

export const STATUS_META: Record<SupplyPriceStatus, { bg: string; fg: string }> = {
  적용중: { bg: '#ecfdf5', fg: '#059669' },
  적용예정: { bg: '#eff6ff', fg: '#2563eb' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
  '가격 미설정': { bg: '#fef2f2', fg: '#dc2626' },
};

export const STATUSES: SupplyPriceStatus[] = ['적용중', '적용예정', '종료', '가격 미설정'];
export const QUICK_FILTER_LABELS = ['전체', ...STATUSES];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function supplyPriceStatusCount(label: string, list: SupplyPrice[]): number {
  return label === '전체' ? list.length : list.filter((p) => p.status === label).length;
}

export const SUPPLY_PRICES: SupplyPrice[] = [
  {
    id: 'PRICE-00128', code: 'P-001238', name: '상품명 01', priceType: '거래처별 공급가', target: '회사 01', basePrice: 32000, price: 29500, minQty: 10, currency: 'KRW', period: '2026.08.01~12.31', start: '2026.08.01', end: '2026.12.31', status: '적용중',
    priority: 2, updated: '2026.08.12', registered: '2026.07.10', admin: 'admin01', cost: 25000, hasTiers: false, tiers: [], contract: null,
    history: [
      { when: '2026.08.13 11:20', admin: 'admin01', from: '29,500원', to: '28,500원', applyDate: '2026.09.01', reason: '거래조건 변경' },
      { when: '2026.07.10 14:10', admin: 'admin02', from: '신규 등록', to: '29,500원', applyDate: '2026.08.01', reason: '-' },
    ],
    scheduled: { price: 28500, period: '2026.09.01~' },
  },
  {
    id: 'PRICE-00040', code: 'P-001238', name: '상품명 01', priceType: '기본 공급가', target: '전체', basePrice: 32000, price: 32000, minQty: null, currency: 'KRW', period: '상시', start: '2026.08.01', end: null, status: '적용중',
    priority: 5, updated: '2026.08.13', registered: '2026.07.01', admin: 'admin01', cost: 25000, hasTiers: false, tiers: [], contract: null,
    history: [{ when: '2026.08.13 09:00', admin: 'admin01', from: '30,000원', to: '32,000원', applyDate: '2026.08.13', reason: '원가 변경' }],
  },
  {
    id: 'PRICE-00512', code: 'P-001239', name: '상품명 02', priceType: '수량구간 공급가', target: '전체', basePrice: 18500, price: 18000, minQty: 100, currency: 'KRW', period: '상시', start: '2026.08.01', end: null, status: '적용중',
    priority: 4, updated: '2026.08.10', registered: '2026.06.20', admin: 'admin02', cost: 16000, hasTiers: true,
    tiers: [
      { range: '1 ~ 9', price: '18,500원' },
      { range: '10 ~ 49', price: '18,200원' },
      { range: '50 ~ 99', price: '18,000원' },
      { range: '100 이상', price: '17,200원' },
    ],
    contract: null,
    history: [{ when: '2026.08.10 15:00', admin: 'admin02', from: '미설정', to: '구간 설정', applyDate: '2026.08.10', reason: '가격 정책 변경' }],
  },
  {
    id: 'PRICE-00611', code: 'P-001240', name: '상품명 03', priceType: '계약 공급가', target: '케이스퀘어', basePrice: 120000, price: 98000, minQty: 1, currency: 'KRW', period: '2026.01.01~12.31', start: '2026.01.01', end: '2026.12.31', status: '적용중',
    priority: 1, updated: '2026.08.05', registered: '2026.01.01', admin: 'admin03', cost: 70000, hasTiers: false, tiers: [],
    contract: { no: 'CT-00128', period: '2026.01.01 ~ 2026.12.31', price: '98,000원' },
    history: [{ when: '2026.01.01 09:00', admin: 'admin03', from: '신규 등록', to: '98,000원', applyDate: '2026.01.01', reason: '계약 변경' }],
  },
  {
    id: 'PRICE-00733', code: 'P-001238', name: '상품명 01', priceType: '거래처별 공급가', target: '대성유통', basePrice: 32000, price: 31000, minQty: 5, currency: 'KRW', period: '2026.09.01~11.30', start: '2026.09.01', end: '2026.11.30', status: '적용예정',
    priority: 2, updated: '2026.08.09', registered: '2026.08.09', admin: 'admin02', cost: 25000, hasTiers: false, tiers: [], contract: null,
    history: [{ when: '2026.08.09 10:00', admin: 'admin02', from: '신규 등록', to: '31,000원', applyDate: '2026.09.01', reason: '프로모션' }],
  },
  {
    id: 'PRICE-00299', code: 'P-000982', name: '상품명 05', priceType: '거래처별 공급가', target: '㈜한빛물산', basePrice: 64000, price: 60000, minQty: 20, currency: 'KRW', period: '2025.11.01~2026.03.31', start: '2025.11.01', end: '2026.03.31', status: '종료',
    priority: 2, updated: '2026.03.01', registered: '2025.11.01', admin: 'admin01', cost: 52000, hasTiers: false, tiers: [], contract: null,
    history: [{ when: '2026.03.01 09:00', admin: 'admin01', from: '60,000원', to: '적용 종료', applyDate: '2026.03.31', reason: '계약 변경' }],
  },
  {
    id: 'PRICE-00815', code: 'P-001241', name: '상품명 04', priceType: '거래처별 공급가', target: '회사 02', basePrice: 0, price: 15000, minQty: 30, currency: 'KRW', period: '상시', start: '2026.08.10', end: null, status: '가격 미설정',
    priority: 2, updated: '2026.08.10', registered: '2026.08.10', admin: 'admin02', cost: 0, hasTiers: false, tiers: [], contract: null,
    history: [{ when: '2026.08.10 16:00', admin: 'admin02', from: '신규 등록', to: '15,000원', applyDate: '2026.08.10', reason: '기타' }],
  },
];
