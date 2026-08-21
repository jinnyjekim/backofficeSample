export type ProductStatus = '등록대기' | '판매중' | '판매중지' | '판매종료';
export type SupplyStatus = '공급가능' | '일시중지' | '공급불가';

export interface ProductOption {
  name: string;
  code: string;
  extra: string;
  status: string;
  statusFg: string;
}

export interface PriceLink {
  label: string;
  value: string;
  action: string;
}

export interface ProductPartnerRow {
  name: string;
  allow: string;
  allowFg: string;
  price: string;
  moq: string;
  status: string;
  statusFg: string;
}

export interface DealSummary {
  count: number;
  qty: number;
  last: string;
}

export interface Deal {
  no: string;
  partner: string;
  qty: number;
  amount: number;
  date: string;
}

export interface HistoryEntry {
  when: string;
  field: string;
  from: string;
  to: string;
  admin: string;
}

export interface Memo {
  when: string;
  admin: string;
  text: string;
}

export interface Product {
  code: string;
  name: string;
  category: string;
  type: string;
  price: number;
  tax: string;
  priceDate: string;
  status: ProductStatus;
  supply: SupplyStatus;
  minQty: number;
  unit: number;
  minAmount: number;
  maxQty: string;
  leadTime: string;
  supplyUnit: string;
  boxQty: number;
  minBoxQty: number;
  partnerCount: number;
  updated: string;
  registered: string;
  admin: string;
  description: string;
  inventoryManaged: boolean;
  stock?: number;
  reserved?: number;
  available?: number;
  safety?: number;
  issues: string[];
  options: ProductOption[];
  priceLinks: PriceLink[];
  partnerRows: ProductPartnerRow[];
  dealSummary: DealSummary;
  deals: Deal[];
  history: HistoryEntry[];
  memos: Memo[];
}

export const STATUS_META: Record<ProductStatus, { bg: string; fg: string }> = {
  등록대기: { bg: '#fffbeb', fg: '#d97706' },
  판매중: { bg: '#ecfdf5', fg: '#059669' },
  판매중지: { bg: '#fef2f2', fg: '#dc2626' },
  판매종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export const SUPPLY_FG: Record<SupplyStatus, string> = {
  공급가능: '#059669',
  일시중지: '#d97706',
  공급불가: '#dc2626',
};

export const STATUSES: ProductStatus[] = ['판매중', '판매중지', '등록대기', '판매종료'];
export const QUICK_FILTER_LABELS = ['전체', ...STATUSES];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function productStatusCount(label: string, list: Product[]): number {
  return label === '전체' ? list.length : list.filter((p) => p.status === label).length;
}

export const PRODUCTS: Product[] = [
  {
    code: 'P-001238', name: '상품명 01', category: '카테고리 01', type: '일반', price: 32000, tax: '별도', priceDate: '2026.07.01',
    status: '판매중', supply: '공급가능', minQty: 10, unit: 5, minAmount: 500000, maxQty: '제한 없음', leadTime: '주문 후 5영업일', supplyUnit: 'Box', boxQty: 20, minBoxQty: 2,
    partnerCount: 12, updated: '2026.08.13', registered: '2026.07.01', admin: 'admin01', description: '등록된 상품 설명 내용입니다.',
    inventoryManaged: true, stock: 2480, reserved: 320, available: 2160, safety: 500, issues: [],
    options: [
      { name: '규격 A', code: 'OP-001', extra: '+0원', status: '사용', statusFg: '#059669' },
      { name: '규격 B', code: 'OP-002', extra: '+5,000원', status: '사용', statusFg: '#059669' },
      { name: '규격 C', code: 'OP-003', extra: '+10,000원', status: '미사용', statusFg: '#a1a1aa' },
    ],
    priceLinks: [
      { label: '거래처별 가격', value: '12건', action: '관리' },
      { label: '계약 단가', value: '4건', action: '보기' },
      { label: '수량별 단가', value: '설정됨', action: '관리' },
    ],
    partnerRows: [
      { name: '회사 01', allow: '허용', allowFg: '#059669', price: '30,000', moq: '10', status: '정상', statusFg: '#059669' },
      { name: '회사 02', allow: '허용', allowFg: '#059669', price: '28,500', moq: '50', status: '정상', statusFg: '#059669' },
      { name: '대성유통', allow: '미허용', allowFg: '#dc2626', price: '-', moq: '-', status: '제한', statusFg: '#dc2626' },
    ],
    dealSummary: { count: 842, qty: 18420, last: '2026.08.13' },
    deals: [
      { no: 'O-00128', partner: '회사 01', qty: 100, amount: 3000000, date: '08.13' },
      { no: 'O-00119', partner: '㈜한빛물산', qty: 50, amount: 1600000, date: '08.11' },
    ],
    history: [
      { when: '2026.08.13 11:20', field: '최소 주문수량', from: '20', to: '10', admin: 'admin01' },
      { when: '2026.08.10 15:30', field: '기본가격', from: '30,000원', to: '32,000원', admin: 'admin02' },
      { when: '2026.07.01 09:10', field: '상품 등록', from: '-', to: '-', admin: 'admin01' },
    ],
    memos: [{ when: '2026.08.13', admin: 'admin01', text: '다음 계약 갱신부터 기본 단가 조정 예정.' }],
  },
  {
    code: 'P-001239', name: '상품명 02', category: '카테고리 02', type: '일반', price: 18500, tax: '포함', priceDate: '2026.06.01',
    status: '판매중지', supply: '일시중지', minQty: 50, unit: 10, minAmount: 1000000, maxQty: '제한 없음', leadTime: '주문 후 7영업일', supplyUnit: 'Box', boxQty: 50, minBoxQty: 1,
    partnerCount: 6, updated: '2026.08.12', registered: '2026.05.10', admin: 'admin02', description: '등록된 상품 설명 내용입니다.',
    inventoryManaged: true, stock: 0, reserved: 0, available: 0, safety: 200, issues: ['공급 중지'],
    options: [{ name: '기본형', code: 'OP-011', extra: '+0원', status: '사용', statusFg: '#059669' }],
    priceLinks: [
      { label: '거래처별 가격', value: '3건', action: '관리' },
      { label: '계약 단가', value: '0건', action: '보기' },
      { label: '수량별 단가', value: '미설정', action: '관리' },
    ],
    partnerRows: [{ name: '회사 02', allow: '허용', allowFg: '#059669', price: '17,000', moq: '50', status: '정상', statusFg: '#059669' }],
    dealSummary: { count: 118, qty: 2400, last: '2026.06.20' },
    deals: [{ no: 'O-00880', partner: '회사 02', qty: 50, amount: 925000, date: '06.20' }],
    history: [
      { when: '2026.08.12 10:00', field: '공급 상태', from: '공급가능', to: '일시중지', admin: 'admin02' },
      { when: '2026.05.10 09:00', field: '상품 등록', from: '-', to: '-', admin: 'admin02' },
    ],
    memos: [],
  },
  {
    code: 'P-001240', name: '상품명 03', category: '카테고리 01', type: '서비스', price: 120000, tax: '별도', priceDate: '2026.05.01',
    status: '판매중', supply: '공급가능', minQty: 1, unit: 1, minAmount: 0, maxQty: '제한 없음', leadTime: '즉시', supplyUnit: '-', boxQty: 0, minBoxQty: 0,
    partnerCount: 24, updated: '2026.08.05', registered: '2026.02.01', admin: 'admin03', description: '등록된 상품 설명 내용입니다.',
    inventoryManaged: false, issues: [],
    options: [],
    priceLinks: [
      { label: '거래처별 가격', value: '0건', action: '관리' },
      { label: '계약 단가', value: '8건', action: '보기' },
      { label: '수량별 단가', value: '미설정', action: '관리' },
    ],
    partnerRows: [{ name: '케이스퀘어', allow: '허용', allowFg: '#059669', price: '110,000', moq: '1', status: '정상', statusFg: '#059669' }],
    dealSummary: { count: 340, qty: 340, last: '2026.08.05' },
    deals: [{ no: 'O-10220', partner: '케이스퀘어', qty: 1, amount: 110000, date: '08.05' }],
    history: [{ when: '2026.02.01 09:00', field: '상품 등록', from: '-', to: '-', admin: 'admin03' }],
    memos: [],
  },
  {
    code: 'P-001241', name: '상품명 04', category: '카테고리 03', type: '일반', price: 0, tax: '별도', priceDate: '-',
    status: '등록대기', supply: '공급불가', minQty: 0, unit: 0, minAmount: 0, maxQty: '-', leadTime: '-', supplyUnit: '-', boxQty: 0, minBoxQty: 0,
    partnerCount: 0, updated: '2026.08.10', registered: '2026.08.10', admin: 'admin02', description: '등록된 상품 설명 내용입니다.',
    inventoryManaged: false, issues: ['가격 미등록'],
    options: [], priceLinks: [], partnerRows: [], dealSummary: { count: 0, qty: 0, last: '-' }, deals: [],
    history: [{ when: '2026.08.10 16:00', field: '상품 등록', from: '-', to: '-', admin: 'admin02' }], memos: [],
  },
  {
    code: 'P-000982', name: '상품명 05', category: '카테고리 02', type: '일반', price: 64000, tax: '별도', priceDate: '2025.11.01',
    status: '판매종료', supply: '공급불가', minQty: 20, unit: 10, minAmount: 800000, maxQty: '제한 없음', leadTime: '-', supplyUnit: 'Box', boxQty: 10, minBoxQty: 1,
    partnerCount: 2, updated: '2026.03.01', registered: '2024.11.01', admin: 'admin01', description: '등록된 상품 설명 내용입니다.',
    inventoryManaged: true, stock: 0, reserved: 0, available: 0, safety: 0, issues: [],
    options: [], priceLinks: [], partnerRows: [],
    dealSummary: { count: 52, qty: 980, last: '2026.02.20' }, deals: [{ no: 'O-08812', partner: '대성유통', qty: 20, amount: 1280000, date: '02.20' }],
    history: [{ when: '2026.03.01 09:00', field: '판매 상태', from: '판매중지', to: '판매종료', admin: 'admin01' }], memos: [],
  },
];
