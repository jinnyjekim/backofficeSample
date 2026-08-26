export type FeeType = '거래 수수료' | '판매 수수료' | '결제 수수료' | '플랫폼 수수료' | '서비스 수수료' | '배송 수수료' | '정산 수수료' | '기타';
export type ApplyScope = '전체 거래' | '특정 대상';
export type FeeBearer = '구매자' | '판매자 / 공급자' | '플랫폼';
export type CalcMethod = '정액' | '정률';
export type CalcUnit = '주문 1건당' | '상품 1개당' | '거래 1건당' | '결제 1건당' | '배송 1건당' | '정산 1건당';
export type CalcBasis = '상품 판매금액' | '할인 후 상품금액' | '주문금액' | '결제금액' | '공급가액' | '정산 대상금액';
export type RoundingRule = '절사' | '반올림' | '올림';
export type TaxTreatment = '포함' | '별도' | '비과세';
export type CancelFeePolicy = '전액 취소' | '수수료 유지' | '취소 정책 참조';
export type RefundFeePolicy = '환불 비율만큼 감소' | '유지' | '전액 반환';
export type ComputedStatus = '적용중' | '적용 예정' | '종료' | '비활성';

export const FEE_TYPES: FeeType[] = ['거래 수수료', '판매 수수료', '결제 수수료', '플랫폼 수수료', '서비스 수수료', '배송 수수료', '정산 수수료', '기타'];
export const CALC_UNITS: CalcUnit[] = ['주문 1건당', '상품 1개당', '거래 1건당', '결제 1건당', '배송 1건당', '정산 1건당'];
export const CALC_BASES: CalcBasis[] = ['상품 판매금액', '할인 후 상품금액', '주문금액', '결제금액', '공급가액', '정산 대상금액'];
export const ROUNDING_UNITS = [1, 10, 100];

export interface FeeHistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface FeePolicy {
  id: string;
  name: string;
  code: string;
  feeType: FeeType;
  description: string;

  applyScope: ApplyScope;
  applyTarget: string;
  bearer: FeeBearer;

  calcMethod: CalcMethod;
  rate: number;
  fixedAmount: number;
  calcUnit: CalcUnit;
  calcBasis: CalcBasis;
  minFee: number;
  maxFee: number | null;
  roundingRule: RoundingRule;
  roundingUnit: number;

  taxTreatment: TaxTreatment;

  startDate: string;
  endDate: string | null;
  priority: number;

  cancelFeePolicy: CancelFeePolicy;
  refundFeePolicy: RefundFeePolicy;

  active: boolean;
  usageCount: number;
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: FeeHistoryEntry[];
}

const TODAY = '2026-08-25';

export function computeStatus(policy: FeePolicy, today: string = TODAY): ComputedStatus {
  if (!policy.active) return '비활성';
  if (policy.startDate > today) return '적용 예정';
  if (policy.endDate && policy.endDate < today) return '종료';
  return '적용중';
}

export function newFeePolicy(): FeePolicy {
  return {
    id: `NEW-${Date.now()}`,
    name: '',
    code: '',
    feeType: '거래 수수료',
    description: '',
    applyScope: '전체 거래',
    applyTarget: '',
    bearer: '판매자 / 공급자',
    calcMethod: '정률',
    rate: 0,
    fixedAmount: 0,
    calcUnit: '주문 1건당',
    calcBasis: '상품 판매금액',
    minFee: 0,
    maxFee: null,
    roundingRule: '반올림',
    roundingUnit: 1,
    taxTreatment: '별도',
    startDate: TODAY,
    endDate: null,
    priority: 6,
    cancelFeePolicy: '취소 정책 참조',
    refundFeePolicy: '환불 비율만큼 감소',
    active: true,
    usageCount: 0,
    adminMemo: '',
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [],
  };
}

export const INITIAL_POLICIES: FeePolicy[] = [
  {
    id: 'FEE-POLICY-001', name: '기본 거래 수수료', code: 'BASE_TRANSACTION_FEE', feeType: '거래 수수료',
    description: '일반 거래에 적용되는 기본 수수료입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정률', rate: 5, fixedAmount: 0, calcUnit: '거래 1건당', calcBasis: '상품 판매금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-01-01', endDate: null, priority: 6,
    cancelFeePolicy: '취소 정책 참조', refundFeePolicy: '환불 비율만큼 감소',
    active: true, usageCount: 4820, adminMemo: '전역 기본 정책. 다른 정책이 없을 때만 적용됩니다.',
    updatedAt: '2026-01-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-002', name: '카드 결제 수수료', code: 'CARD_PAYMENT_FEE', feeType: '결제 수수료',
    description: '카드 결제 건에 대한 PG 연동 수수료입니다.',
    applyScope: '특정 대상', applyTarget: '카드 결제', bearer: '판매자 / 공급자',
    calcMethod: '정률', rate: 2.5, fixedAmount: 0, calcUnit: '결제 1건당', calcBasis: '결제금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '포함',
    startDate: '2026-01-01', endDate: null, priority: 2,
    cancelFeePolicy: '수수료 유지', refundFeePolicy: '유지',
    active: true, usageCount: 3120, adminMemo: '',
    updatedAt: '2026-01-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-003', name: '플랫폼 이용 수수료', code: 'PLATFORM_USAGE_FEE', feeType: '플랫폼 수수료',
    description: '정산 1건당 부과되는 플랫폼 이용 수수료입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '플랫폼',
    calcMethod: '정액', rate: 0, fixedAmount: 500, calcUnit: '정산 1건당', calcBasis: '정산 대상금액',
    minFee: 0, maxFee: null, roundingRule: '절사', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-01-01', endDate: null, priority: 3,
    cancelFeePolicy: '전액 취소', refundFeePolicy: '전액 반환',
    active: true, usageCount: 812, adminMemo: '',
    updatedAt: '2026-01-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-004', name: '가을 프로모션 거래 수수료', code: 'AUTUMN_PROMO_FEE', feeType: '거래 수수료',
    description: '9월 한시 프로모션 거래 수수료입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정률', rate: 3, fixedAmount: 0, calcUnit: '거래 1건당', calcBasis: '상품 판매금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-08-01', endDate: '2026-09-30', priority: 6,
    cancelFeePolicy: '취소 정책 참조', refundFeePolicy: '환불 비율만큼 감소',
    active: true, usageCount: 96, adminMemo: '기본 거래 수수료와 동일한 우선순위로 등록되어 충돌 확인이 필요합니다.',
    updatedAt: '2026-08-01', updatedBy: 'admin02', history: [
      { id: 'H1', at: '2026-08-01 10:00', by: 'admin02', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-005', name: '설치 서비스 수수료', code: 'INSTALL_SERVICE_FEE', feeType: '서비스 수수료',
    description: '설치 서비스가 포함된 주문에 대한 정액 수수료입니다.',
    applyScope: '특정 대상', applyTarget: '설치 서비스 상품', bearer: '판매자 / 공급자',
    calcMethod: '정액', rate: 0, fixedAmount: 3000, calcUnit: '주문 1건당', calcBasis: '주문금액',
    minFee: 0, maxFee: null, roundingRule: '올림', roundingUnit: 10, taxTreatment: '비과세',
    startDate: '2026-01-01', endDate: null, priority: 4,
    cancelFeePolicy: '전액 취소', refundFeePolicy: '전액 반환',
    active: true, usageCount: 210, adminMemo: '',
    updatedAt: '2026-01-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-006', name: '배송 플랫폼 수수료', code: 'DELIVERY_PLATFORM_FEE', feeType: '배송 수수료',
    description: '',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정액', rate: 0, fixedAmount: 500, calcUnit: '배송 1건당', calcBasis: '주문금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-01-01', endDate: null, priority: 5,
    cancelFeePolicy: '수수료 유지', refundFeePolicy: '유지',
    active: true, usageCount: 1890, adminMemo: '',
    updatedAt: '2026-01-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-007', name: '구 결제 수수료 (종료)', code: 'LEGACY_PAYMENT_FEE', feeType: '결제 수수료',
    description: '2025년까지 적용되던 결제 수수료입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정률', rate: 3, fixedAmount: 0, calcUnit: '결제 1건당', calcBasis: '결제금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '포함',
    startDate: '2025-01-01', endDate: '2025-12-31', priority: 1,
    cancelFeePolicy: '수수료 유지', refundFeePolicy: '유지',
    active: true, usageCount: 5210, adminMemo: '',
    updatedAt: '2025-12-31', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2025-01-01 09:00', by: 'admin01', action: '정책 생성' },
      { id: 'H2', at: '2025-12-31 18:00', by: 'admin01', action: '정책 종료', before: '상시', after: '2025-12-31 종료' },
    ],
  },
  {
    id: 'FEE-POLICY-008', name: '연말 프로모션 거래 수수료', code: 'YEAREND_PROMO_FEE', feeType: '거래 수수료',
    description: '12월 한시 프로모션 거래 수수료입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정률', rate: 2, fixedAmount: 0, calcUnit: '거래 1건당', calcBasis: '상품 판매금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-12-01', endDate: '2026-12-31', priority: 2,
    cancelFeePolicy: '취소 정책 참조', refundFeePolicy: '환불 비율만큼 감소',
    active: true, usageCount: 0, adminMemo: '',
    updatedAt: '2026-08-10', updatedBy: 'admin02', history: [
      { id: 'H1', at: '2026-08-10 11:00', by: 'admin02', action: '정책 생성' },
    ],
  },
  {
    id: 'FEE-POLICY-009', name: '단종 배송 수수료', code: 'DEPRECATED_DELIVERY_FEE', feeType: '배송 수수료',
    description: '더 이상 사용하지 않는 배송 수수료 정책입니다.',
    applyScope: '전체 거래', applyTarget: '', bearer: '판매자 / 공급자',
    calcMethod: '정액', rate: 0, fixedAmount: 300, calcUnit: '배송 1건당', calcBasis: '주문금액',
    minFee: 0, maxFee: null, roundingRule: '반올림', roundingUnit: 1, taxTreatment: '별도',
    startDate: '2026-01-01', endDate: null, priority: 9,
    cancelFeePolicy: '수수료 유지', refundFeePolicy: '유지',
    active: false, usageCount: 0, adminMemo: '신규 배송 수수료 정책으로 대체되어 비활성화함.',
    updatedAt: '2026-07-01', updatedBy: 'admin01', history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 생성' },
      { id: 'H2', at: '2026-07-01 10:00', by: 'admin01', action: '정책 비활성화' },
    ],
  },
];

export type QuickFilter = '전체' | '적용중' | '적용 예정' | '종료' | '비활성' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '적용중', '적용 예정', '종료', '비활성', '확인 필요'];

export interface PolicyWarnings {
  [policyId: string]: string[];
}

export function computeWarnings(policies: FeePolicy[]): PolicyWarnings {
  const map: PolicyWarnings = {};
  const add = (id: string, message: string) => { (map[id] ??= []).push(message); };

  policies.forEach((p) => {
    if (p.calcMethod === '정률' && p.rate <= 0) add(p.id, '정률 방식인데 수수료율이 없습니다.');
    if (p.calcMethod === '정액' && p.fixedAmount <= 0) add(p.id, '정액 방식인데 금액이 없습니다.');
    if (p.maxFee !== null && p.maxFee < p.minFee) add(p.id, '최소 수수료가 최대 수수료보다 큽니다.');
    if (p.endDate && p.endDate < p.startDate) add(p.id, '적용 시작일이 종료일보다 늦습니다.');
  });

  const active = policies.filter((p) => p.active);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.feeType !== b.feeType || a.priority !== b.priority) continue;
      const aEnd = a.endDate ?? '9999-12-31';
      const bEnd = b.endDate ?? '9999-12-31';
      const overlaps = a.startDate <= bEnd && b.startDate <= aEnd;
      if (overlaps) {
        add(a.id, `동일 유형(${a.feeType})·동일 우선순위(${a.priority}) 정책 '${b.name}'과 적용기간이 겹칩니다.`);
        add(b.id, `동일 유형(${b.feeType})·동일 우선순위(${b.priority}) 정책 '${a.name}'과 적용기간이 겹칩니다.`);
      }
    }
  }
  return map;
}

export function matchesQuickFilter(policy: FeePolicy, filter: QuickFilter, warnings: PolicyWarnings, today: string = TODAY): boolean {
  if (filter === '전체') return true;
  if (filter === '확인 필요') return (warnings[policy.id]?.length ?? 0) > 0;
  return computeStatus(policy, today) === filter;
}

export function fmtPeriod(policy: FeePolicy): string {
  if (!policy.endDate) return `${policy.startDate} ~ 상시`;
  return `${policy.startDate} ~ ${policy.endDate}`;
}

export function fmtCalc(policy: FeePolicy): string {
  return policy.calcMethod === '정률' ? `${policy.rate}%` : `${policy.fixedAmount.toLocaleString()}원 / ${policy.calcUnit}`;
}

export interface FeePreviewResult {
  baseAmount: number;
  rawFee: number;
  clampedFee: number;
  roundedFee: number;
  taxAmount: number;
  totalFee: number;
}

function applyRounding(value: number, rule: RoundingRule, unit: number): number {
  if (unit <= 0) return Math.round(value);
  const scaled = value / unit;
  const rounded = rule === '절사' ? Math.floor(scaled) : rule === '올림' ? Math.ceil(scaled) : Math.round(scaled);
  return rounded * unit;
}

export function computeFeePreview(policy: FeePolicy, baseAmount: number): FeePreviewResult {
  const rawFee = policy.calcMethod === '정률' ? baseAmount * (policy.rate / 100) : policy.fixedAmount;
  let clampedFee = policy.minFee > 0 ? Math.max(rawFee, policy.minFee) : rawFee;
  if (policy.maxFee !== null) clampedFee = Math.min(clampedFee, policy.maxFee);
  const roundedFee = applyRounding(clampedFee, policy.roundingRule, policy.roundingUnit);
  const taxAmount = policy.taxTreatment === '별도' ? applyRounding(roundedFee * 0.1, policy.roundingRule, policy.roundingUnit) : 0;
  return { baseAmount, rawFee, clampedFee, roundedFee, taxAmount, totalFee: roundedFee + taxAmount };
}
