export type ShippingUsage = '사용' | '무료배송만 사용' | '미사용';
export type CalcUnit = '배송건당' | '주문당';
export type TaxTreatment = '과세' | '비과세' | '세금 정책에 따름';
export type FreeShippingBasis = '할인 후 상품금액' | '할인 전 상품금액' | '최종 결제금액' | '배송비 제외 주문금액';
export type FreeShippingCompare = '이상' | '초과';
export type FreeShippingScope = '기본 배송비만 면제' | '지역 추가배송비 포함 전체 면제';
export type BundleCalc = '배송비 1회만 부과' | '가장 높은 배송비 1건 적용' | '모든 배송비 합산';

export interface ShippingBasePolicy {
  usage: ShippingUsage;
  baseFee: number;
  calcUnit: CalcUnit;
  minFee: number;
  maxFee: number | null;
  taxTreatment: TaxTreatment;
  startDate: string;

  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingBasis: FreeShippingBasis;
  freeShippingCompare: FreeShippingCompare;
  freeShippingScope: FreeShippingScope;

  bundleCalc: BundleCalc;
  splitShippingExtraFee: boolean;
}

export interface PolicyHistoryEntry {
  id: string;
  at: string;
  by: string;
  field: string;
  before: string;
  after: string;
  reason: string;
}

export const INITIAL_POLICY: ShippingBasePolicy = {
  usage: '무료배송만 사용',
  baseFee: 3000,
  calcUnit: '배송건당',
  minFee: 0,
  maxFee: null,
  taxTreatment: '세금 정책에 따름',
  startDate: '2026-08-01',

  freeShippingEnabled: false,
  freeShippingThreshold: 50000,
  freeShippingBasis: '할인 후 상품금액',
  freeShippingCompare: '이상',
  freeShippingScope: '기본 배송비만 면제',

  bundleCalc: '배송비 1회만 부과',
  splitShippingExtraFee: false,
};

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-07-01 10:00', by: 'admin02', field: '무료배송 기준금액', before: '30,000원', after: '50,000원', reason: '평균 객단가 상승 반영' },
  { id: 'H-2', at: '2026-06-01 09:20', by: 'admin01', field: '기본 배송비', before: '2,500원', after: '3,000원', reason: '택배 기본 운임 변경' },
];

export interface ShippingTestOrder {
  id: string;
  target: string;
  productAmount: number;
  discount: number;
  pointsUsed: number;
  shippingGroups: number;
  hasIndividualItem: boolean;
  individualItemLabel: string;
}

export const TEST_ORDERS: ShippingTestOrder[] = [
  { id: 'ORD-P1', target: '회사 01', productAmount: 80000, discount: 10000, pointsUsed: 0, shippingGroups: 1, hasIndividualItem: false, individualItemLabel: '' },
  { id: 'ORD-P2', target: '회사 02', productAmount: 35000, discount: 0, pointsUsed: 0, shippingGroups: 1, hasIndividualItem: false, individualItemLabel: '' },
  { id: 'ORD-P3', target: '회사 03', productAmount: 90000, discount: 20000, pointsUsed: 25000, shippingGroups: 1, hasIndividualItem: true, individualItemLabel: '대형가전 (개별배송)' },
  { id: 'ORD-P4', target: '회사 04', productAmount: 35000, discount: 0, pointsUsed: 0, shippingGroups: 2, hasIndividualItem: false, individualItemLabel: '' },
];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function signed(n: number): string {
  if (n === 0) return '0원';
  return (n > 0 ? '+' : '-') + fmtWon(Math.abs(n));
}
export { signed };

export interface ShippingBreakdownItem {
  label: string;
  amount: number;
}

export interface ShippingPreviewResult {
  basisAmount: number;
  freeShippingApplied: boolean;
  items: ShippingBreakdownItem[];
  rawTotal: number;
  finalFee: number;
  clamped: boolean;
}

function computeBasis(order: ShippingTestOrder, basis: FreeShippingBasis): number {
  switch (basis) {
    case '할인 전 상품금액': return order.productAmount;
    case '할인 후 상품금액': return order.productAmount - order.discount;
    case '배송비 제외 주문금액': return order.productAmount - order.discount;
    case '최종 결제금액': return order.productAmount - order.discount - order.pointsUsed;
  }
}

export function computeShippingPreview(order: ShippingTestOrder, policy: ShippingBasePolicy): ShippingPreviewResult {
  if (policy.usage === '미사용') {
    return { basisAmount: 0, freeShippingApplied: false, items: [{ label: '배송비 미사용 정책', amount: 0 }], rawTotal: 0, finalFee: 0, clamped: false };
  }

  const basisAmount = computeBasis(order, policy.freeShippingBasis);
  const freeShippingApplied = policy.freeShippingEnabled
    && (policy.freeShippingCompare === '이상' ? basisAmount >= policy.freeShippingThreshold : basisAmount > policy.freeShippingThreshold);

  const groupFee = policy.bundleCalc === '모든 배송비 합산' ? policy.baseFee * order.shippingGroups : policy.baseFee;
  const individualFee = order.hasIndividualItem ? policy.baseFee : 0;

  const items: ShippingBreakdownItem[] = [
    { label: order.shippingGroups > 1 ? `기본 배송비 (${order.shippingGroups}개 배송그룹)` : '기본 배송비', amount: groupFee },
  ];
  if (individualFee > 0) items.push({ label: `개별배송 추가 (${order.individualItemLabel})`, amount: individualFee });

  let rawTotal = groupFee + individualFee;

  if (freeShippingApplied) {
    if (policy.freeShippingScope === '지역 추가배송비 포함 전체 면제') {
      items.push({ label: '무료배송 할인', amount: -(groupFee + individualFee) });
      rawTotal = 0;
    } else {
      items.push({ label: '무료배송 할인 (기본 배송비만)', amount: -groupFee });
      rawTotal = individualFee;
    }
  }

  let finalFee = rawTotal;
  let clamped = false;
  if (rawTotal > 0 && policy.minFee > 0 && finalFee < policy.minFee) {
    finalFee = policy.minFee;
    clamped = true;
  }
  if (policy.maxFee !== null && finalFee > policy.maxFee) {
    finalFee = policy.maxFee;
    clamped = true;
  }

  return { basisAmount, freeShippingApplied, items, rawTotal, finalFee, clamped };
}

export interface ValidationWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: ShippingBasePolicy): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (policy.usage === '무료배송만 사용' && !policy.freeShippingEnabled) {
    warnings.push({ id: 'usage-mismatch', message: "배송비 사용 방식이 '무료배송만 사용'이지만 무료배송 설정이 꺼져 있습니다." });
  }
  if (policy.freeShippingEnabled && policy.freeShippingThreshold <= 0) {
    warnings.push({ id: 'threshold-zero', message: '무료배송 기준금액이 0원입니다.' });
  }
  if (policy.maxFee !== null && policy.maxFee < policy.minFee) {
    warnings.push({ id: 'min-max', message: '최소 배송비가 최대 배송비보다 큽니다.' });
  }
  if (policy.baseFee < 0) {
    warnings.push({ id: 'base-negative', message: '기본 배송비가 음수입니다.' });
  }

  return warnings;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof ShippingBasePolicy; label: string; format: (p: ShippingBasePolicy) => string }[] = [
  { key: 'usage', label: '배송비 사용 여부', format: (p) => p.usage },
  { key: 'baseFee', label: '기본 배송비', format: (p) => fmtWon(p.baseFee) },
  { key: 'calcUnit', label: '배송비 계산 단위', format: (p) => p.calcUnit },
  { key: 'minFee', label: '최소 배송비', format: (p) => fmtWon(p.minFee) },
  { key: 'maxFee', label: '최대 배송비', format: (p) => (p.maxFee === null ? '제한 없음' : fmtWon(p.maxFee)) },
  { key: 'taxTreatment', label: '배송비 과세 구분', format: (p) => p.taxTreatment },
  { key: 'startDate', label: '적용 시작일', format: (p) => p.startDate },
  { key: 'freeShippingEnabled', label: '무료배송 사용', format: (p) => (p.freeShippingEnabled ? '사용' : '사용 안 함') },
  { key: 'freeShippingThreshold', label: '무료배송 기준금액', format: (p) => fmtWon(p.freeShippingThreshold) },
  { key: 'freeShippingBasis', label: '무료배송 기준금액 계산', format: (p) => p.freeShippingBasis },
  { key: 'freeShippingCompare', label: '무료배송 기준 비교', format: (p) => p.freeShippingCompare },
  { key: 'freeShippingScope', label: '무료배송 적용 범위', format: (p) => p.freeShippingScope },
  { key: 'bundleCalc', label: '묶음배송 계산', format: (p) => p.bundleCalc },
  { key: 'splitShippingExtraFee', label: '운영상 분할배송 추가비', format: (p) => (p.splitShippingExtraFee ? '부과' : '미부과') },
];

export function describePolicyChanges(before: ShippingBasePolicy, after: ShippingBasePolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => before[key] !== after[key]).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}
