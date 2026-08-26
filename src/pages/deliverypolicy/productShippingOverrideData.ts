import { PRODUCTS, type Product } from '../products/productsData';
import { INITIAL_POLICY as BASE_SHIPPING_POLICY } from './shippingBaseFeeData';

export type DeliveryMethod = '택배' | '직배송' | '방문수령';
export type FeeType = '무료배송' | '고정 배송비' | '조건부 무료배송';
export type RegionalFeePolicyMode = '기본 정책 사용' | '상품별 별도 설정';
export type BundleShipping = '가능' | '불가';
export type ReturnFeePolicyMode = '기본 정책 사용' | '상품별 설정';
export type Region = '일반' | '제주/도서산간';

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface ProductShippingOverride {
  productCode: string;
  usesOverride: boolean;

  deliveryMethod: DeliveryMethod;
  warehouse: string;

  feeType: FeeType;
  fixedFee: number;
  freeShippingThreshold: number;

  regionalFeePolicy: RegionalFeePolicyMode;
  regionalFeeOverrideAmount: number;
  unavailableRegions: string[];

  bundleShipping: BundleShipping;

  returnFeePolicy: ReturnFeePolicyMode;
  returnFeeOverride: number;
  exchangeFeeOverride: number;

  startDate: string;
  endDate: string | null;
  active: boolean;
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
}

const TODAY = '2026-08-25';

// Mirrors the default 제주/도서산간 regional surcharge set in 지역별 추가 배송비 (RSF-001), used
// as the reference amount when a product-level override defers to the base regional policy.
export const REFERENCE_REGIONAL_FEE = 3000;
export const REGIONS: Region[] = ['일반', '제주/도서산간'];
export const DELIVERY_METHODS: DeliveryMethod[] = ['택배', '직배송', '방문수령'];
export const WAREHOUSES = ['창고01', '창고02', '외부 물류센터'];

export function newOverride(productCode: string): ProductShippingOverride {
  return {
    productCode,
    usesOverride: true,
    deliveryMethod: '택배',
    warehouse: '창고01',
    feeType: '고정 배송비',
    fixedFee: 3000,
    freeShippingThreshold: 50000,
    regionalFeePolicy: '기본 정책 사용',
    regionalFeeOverrideAmount: 0,
    unavailableRegions: [],
    bundleShipping: '가능',
    returnFeePolicy: '기본 정책 사용',
    returnFeeOverride: 0,
    exchangeFeeOverride: 0,
    startDate: TODAY,
    endDate: null,
    active: true,
    adminMemo: '',
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [],
  };
}

function defaultOverride(productCode: string): ProductShippingOverride {
  return { ...newOverride(productCode), usesOverride: false, history: [] };
}

export const INITIAL_OVERRIDES: Record<string, ProductShippingOverride> = {
  'P-001238': defaultOverride('P-001238'),
  'P-001239': {
    ...newOverride('P-001239'),
    deliveryMethod: '택배', warehouse: '창고01',
    feeType: '고정 배송비', fixedFee: 5000, freeShippingThreshold: 0,
    regionalFeePolicy: '기본 정책 사용', regionalFeeOverrideAmount: 0,
    bundleShipping: '가능', unavailableRegions: [],
    returnFeePolicy: '기본 정책 사용', returnFeeOverride: 0, exchangeFeeOverride: 0,
    startDate: '2026-06-01', endDate: null, active: true,
    adminMemo: '상품 부피가 커서 기본 배송비보다 높게 책정함.',
    updatedAt: '2026-06-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-06-01 10:00', by: 'admin01', action: '상품별 정책 등록', after: '고정 배송비 5,000원' }],
  },
  'P-001240': {
    ...newOverride('P-001240'),
    deliveryMethod: '직배송', warehouse: '외부 물류센터',
    feeType: '고정 배송비', fixedFee: 15000, freeShippingThreshold: 0,
    regionalFeePolicy: '기본 정책 사용', regionalFeeOverrideAmount: 0,
    bundleShipping: '불가', unavailableRegions: ['제주/도서산간'],
    returnFeePolicy: '상품별 설정', returnFeeOverride: 15000, exchangeFeeOverride: 30000,
    startDate: '2026-01-01', endDate: null, active: true,
    adminMemo: '설치가 필요한 서비스 상품으로 직배송 기사 방문이 불가한 도서산간 지역은 배송 불가 처리.',
    updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '상품별 정책 등록', after: '직배송 15,000원' }],
  },
  'P-001241': defaultOverride('P-001241'),
  'P-000982': {
    ...newOverride('P-000982'),
    deliveryMethod: '택배', warehouse: '',
    feeType: '무료배송', fixedFee: 0, freeShippingThreshold: 0,
    regionalFeePolicy: '상품별 별도 설정', regionalFeeOverrideAmount: 8000,
    bundleShipping: '가능', unavailableRegions: [],
    returnFeePolicy: '기본 정책 사용', returnFeeOverride: 0, exchangeFeeOverride: 0,
    startDate: '2026-07-01', endDate: null, active: true,
    adminMemo: '전 상품 무료배송 프로모션 대상. 고중량 상품이라 지역 추가비는 별도로 상향 설정.',
    updatedAt: '2026-07-01', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-07-01 11:00', by: 'admin02', action: '상품별 정책 등록', after: '무료배송' }],
  },
};

export type QuickFilter = '전체' | '기본 정책 적용' | '별도 정책 적용' | '무료배송 상품' | '묶음배송 불가' | '설정 확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '기본 정책 적용', '별도 정책 적용', '무료배송 상품', '묶음배송 불가', '설정 확인 필요'];

export interface PolicyWarnings {
  [productCode: string]: string[];
}

export function computeWarnings(overrides: Record<string, ProductShippingOverride>): PolicyWarnings {
  const map: PolicyWarnings = {};
  const add = (code: string, message: string) => { (map[code] ??= []).push(message); };

  Object.values(overrides).forEach((o) => {
    if (!o.usesOverride) return;
    if (!o.warehouse) add(o.productCode, '출고지가 설정되지 않았습니다.');
    if ((o.feeType === '고정 배송비' || o.feeType === '조건부 무료배송') && o.fixedFee <= 0) add(o.productCode, '배송비가 설정되지 않았습니다.');
    if (o.feeType === '조건부 무료배송' && o.freeShippingThreshold <= 0) add(o.productCode, '무료배송 기준금액이 설정되지 않았습니다.');
    if (o.endDate && o.endDate < o.startDate) add(o.productCode, '적용 시작일이 종료일보다 늦습니다.');
  });
  return map;
}

export function matchesQuickFilter(_product: Product, o: ProductShippingOverride, filter: QuickFilter, warnings: PolicyWarnings): boolean {
  if (filter === '전체') return true;
  if (filter === '기본 정책 적용') return !o.usesOverride;
  if (filter === '별도 정책 적용') return o.usesOverride;
  if (filter === '무료배송 상품') return o.usesOverride && o.feeType === '무료배송';
  if (filter === '묶음배송 불가') return o.usesOverride && o.bundleShipping === '불가';
  return (warnings[o.productCode]?.length ?? 0) > 0;
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function fmtFee(o: ProductShippingOverride): string {
  if (!o.usesOverride) return `${fmtWon(BASE_SHIPPING_POLICY.baseFee)} (기본)`;
  if (o.feeType === '무료배송') return '무료배송';
  if (o.feeType === '조건부 무료배송') return `${fmtWon(o.fixedFee)} (${fmtWon(o.freeShippingThreshold)} 이상 무료)`;
  return fmtWon(o.fixedFee);
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const FIELD_LABELS: { key: keyof ProductShippingOverride; label: string; format: (o: ProductShippingOverride) => string }[] = [
  { key: 'usesOverride', label: '정책 적용 방식', format: (o) => (o.usesOverride ? '상품별 배송 정책 사용' : '기본 배송 정책 사용') },
  { key: 'deliveryMethod', label: '배송 방식', format: (o) => o.deliveryMethod },
  { key: 'warehouse', label: '출고지', format: (o) => o.warehouse || '-' },
  { key: 'feeType', label: '배송비 유형', format: (o) => o.feeType },
  { key: 'fixedFee', label: '기본 배송비', format: (o) => fmtWon(o.fixedFee) },
  { key: 'freeShippingThreshold', label: '무료배송 기준금액', format: (o) => fmtWon(o.freeShippingThreshold) },
  { key: 'regionalFeePolicy', label: '지역 추가 배송비', format: (o) => o.regionalFeePolicy },
  { key: 'regionalFeeOverrideAmount', label: '지역 추가비(상품별)', format: (o) => fmtWon(o.regionalFeeOverrideAmount) },
  { key: 'bundleShipping', label: '묶음배송', format: (o) => o.bundleShipping },
  { key: 'returnFeePolicy', label: '반품/교환 배송비', format: (o) => o.returnFeePolicy },
  { key: 'returnFeeOverride', label: '반품 배송비(상품별)', format: (o) => fmtWon(o.returnFeeOverride) },
  { key: 'exchangeFeeOverride', label: '교환 배송비(상품별)', format: (o) => fmtWon(o.exchangeFeeOverride) },
  { key: 'startDate', label: '적용 시작일', format: (o) => o.startDate },
  { key: 'endDate', label: '적용 종료일', format: (o) => o.endDate ?? '상시' },
  { key: 'active', label: '사용 여부', format: (o) => (o.active ? '사용' : '비활성') },
];

export function describeChanges(before: ProductShippingOverride, after: ProductShippingOverride): FieldDiff[] {
  return FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

// ---- Shipping fee calculation preview for a single product ----

export interface CalcScenario {
  id: string;
  label: string;
  quantity: number;
  orderAmount: number;
  region: Region;
}

export const CALC_SCENARIOS: CalcScenario[] = [
  { id: 'SC-1', label: '일반 지역 · 소액 주문', quantity: 1, orderAmount: 20000, region: '일반' },
  { id: 'SC-2', label: '일반 지역 · 고액 주문', quantity: 2, orderAmount: 90000, region: '일반' },
  { id: 'SC-3', label: '제주/도서산간 배송', quantity: 1, orderAmount: 40000, region: '제주/도서산간' },
];

export interface CalcResult {
  deliverable: boolean;
  baseFee: number;
  regionFee: number;
  finalFee: number;
  source: string;
}

export function computeProductShippingFee(o: ProductShippingOverride, scenario: CalcScenario): CalcResult {
  if (o.usesOverride && o.unavailableRegions.includes(scenario.region)) {
    return { deliverable: false, baseFee: 0, regionFee: 0, finalFee: 0, source: `${o.productCode} 상품별 정책 (배송 불가 지역)` };
  }

  if (!o.usesOverride) {
    const regionFee = scenario.region === '제주/도서산간' ? REFERENCE_REGIONAL_FEE : 0;
    return { deliverable: true, baseFee: BASE_SHIPPING_POLICY.baseFee, regionFee, finalFee: BASE_SHIPPING_POLICY.baseFee + regionFee, source: '기본 배송 정책' };
  }

  let baseFee = 0;
  if (o.feeType === '무료배송') baseFee = 0;
  else if (o.feeType === '고정 배송비') baseFee = o.fixedFee;
  else baseFee = scenario.orderAmount >= o.freeShippingThreshold ? 0 : o.fixedFee;

  const regionFee = scenario.region === '제주/도서산간'
    ? (o.regionalFeePolicy === '상품별 별도 설정' ? o.regionalFeeOverrideAmount : REFERENCE_REGIONAL_FEE)
    : 0;

  return { deliverable: true, baseFee, regionFee, finalFee: baseFee + regionFee, source: `${o.productCode} 상품별 정책` };
}

export { PRODUCTS, BASE_SHIPPING_POLICY };
export type { Product };
