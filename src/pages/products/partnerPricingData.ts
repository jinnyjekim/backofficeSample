export type PartnerPricingStatus = '적용중' | '적용예정' | '종료';
export type PriceBasis = '개별 가격' | '기본가 사용' | '계약 적용';

export interface PartnerPriceContract {
  no: string;
  period: string;
  price: string;
}

export interface PartnerPriceHistoryEntry {
  when: string;
  admin: string;
  from: string;
  to: string;
  applyDate: string;
  reason: string;
}

export interface PartnerPriceScheduled {
  price: number;
  date: string;
}

export interface PartnerPrice {
  id: string;
  code: string;
  name: string;
  partner: string;
  partnerCode: string;
  basePrice: number;
  price: number;
  cost: number;
  minQty: number;
  maxQty: string;
  start: string;
  end: string | null;
  period: string;
  status: PartnerPricingStatus;
  basis: PriceBasis;
  priority: number;
  registered: string;
  admin: string;
  currency: string;
  contract: PartnerPriceContract | null;
  history: PartnerPriceHistoryEntry[];
  scheduled?: PartnerPriceScheduled;
}

export const STATUS_META: Record<PartnerPricingStatus, { bg: string; fg: string }> = {
  적용중: { bg: '#ecfdf5', fg: '#059669' },
  적용예정: { bg: '#eff6ff', fg: '#2563eb' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export const STATUSES: PartnerPricingStatus[] = ['적용중', '적용예정', '종료'];
export const QUICK_FILTER_LABELS = ['전체', ...STATUSES, '가격 이슈'];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function issueOf(it: PartnerPrice): string[] {
  const diffPct = it.basePrice ? ((it.price - it.basePrice) / it.basePrice) * 100 : 0;
  const issues: string[] = [];
  if (diffPct <= -30) issues.push('기준가 대비 -30% 이상');
  if (it.price < it.cost) issues.push('원가 이하');
  return issues;
}

export function partnerPricingCount(label: string, list: PartnerPrice[]): number {
  if (label === '전체') return list.length;
  if (label === '가격 이슈') return list.filter((it) => issueOf(it).length > 0).length;
  return list.filter((it) => it.status === label).length;
}

export const PARTNER_PRICES: PartnerPrice[] = [
  {
    id: 'PRICE-C-00128', code: 'P-001238', name: '상품명 01', partner: '회사 01', partnerCode: 'C-00123', basePrice: 32000, price: 29000, cost: 24000, minQty: 10, maxQty: '제한 없음',
    start: '2026.08.01', end: '2026.12.31', period: '08.01~12.31', status: '적용중', basis: '개별 가격', priority: 2, registered: '2026.07.01', admin: 'admin01', currency: 'KRW',
    contract: null,
    history: [
      { when: '2026.08.13 14:20', admin: 'admin01', from: '31,000원', to: '29,000원', applyDate: '2026.07.01', reason: '거래 조건 변경' },
      { when: '2026.01.01 10:10', admin: 'admin02', from: '신규 등록', to: '31,000원', applyDate: '2026.01.01', reason: '-' },
    ],
  },
  {
    id: 'PRICE-C-00129', code: 'P-001239', name: '상품명 02', partner: '회사 01', partnerCode: 'C-00123', basePrice: 18000, price: 17500, cost: 15000, minQty: 20, maxQty: '제한 없음',
    start: '2026.01.01', end: null, period: '상시', status: '적용중', basis: '개별 가격', priority: 2, registered: '2026.01.01', admin: 'admin01', currency: 'KRW',
    contract: null,
    history: [{ when: '2026.01.01 09:00', admin: 'admin01', from: '신규 등록', to: '17,500원', applyDate: '2026.01.01', reason: '-' }],
  },
  {
    id: 'PRICE-C-00201', code: 'P-001238', name: '상품명 01', partner: '회사 02', partnerCode: 'C-00201', basePrice: 32000, price: 30000, cost: 24000, minQty: 50, maxQty: '제한 없음',
    start: '2026.09.01', end: null, period: '09.01~', status: '적용예정', basis: '개별 가격', priority: 2, registered: '2026.08.09', admin: 'admin02', currency: 'KRW',
    contract: null,
    history: [{ when: '2026.08.09 10:00', admin: 'admin02', from: '신규 등록', to: '30,000원', applyDate: '2026.09.01', reason: '프로모션' }],
  },
  {
    id: 'PRICE-C-00340', code: 'P-001240', name: '상품명 03', partner: '케이스퀘어', partnerCode: 'C-00340', basePrice: 120000, price: 110000, cost: 70000, minQty: 1, maxQty: '제한 없음',
    start: '2026.01.01', end: '2026.12.31', period: '01.01~12.31', status: '적용중', basis: '계약 적용', priority: 1, registered: '2026.01.01', admin: 'admin03', currency: 'KRW',
    contract: { no: 'CT-00128', period: '2026.01.01 ~ 2026.12.31', price: '98,000원' },
    history: [{ when: '2026.01.01 09:00', admin: 'admin03', from: '신규 등록', to: '98,000원', applyDate: '2026.01.01', reason: '계약 변경' }],
  },
  {
    id: 'PRICE-C-00415', code: 'P-000982', name: '상품명 05', partner: '㈜한빛물산', partnerCode: 'C-00415', basePrice: 64000, price: 60000, cost: 52000, minQty: 20, maxQty: '제한 없음',
    start: '2025.11.01', end: '2026.03.31', period: '25.11.01~26.03.31', status: '종료', basis: '개별 가격', priority: 2, registered: '2025.11.01', admin: 'admin01', currency: 'KRW',
    contract: null,
    history: [{ when: '2026.03.01 09:00', admin: 'admin01', from: '60,000원', to: '적용 종료', applyDate: '2026.03.31', reason: '계약 변경' }],
  },
  {
    id: 'PRICE-C-00512', code: 'P-001238', name: '상품명 01', partner: '대성유통', partnerCode: 'C-00512', basePrice: 32000, price: 20000, cost: 24000, minQty: 5, maxQty: '제한 없음',
    start: '2026.08.01', end: null, period: '상시', status: '적용중', basis: '개별 가격', priority: 2, registered: '2026.08.01', admin: 'admin02', currency: 'KRW',
    contract: null,
    history: [{ when: '2026.08.01 09:00', admin: 'admin02', from: '신규 등록', to: '20,000원', applyDate: '2026.08.01', reason: '오류 정정' }],
    scheduled: { price: 26000, date: '2026.09.01' },
  },
];
