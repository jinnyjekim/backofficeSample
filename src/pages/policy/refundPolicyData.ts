export type RefundMethodBasis = '원 결제수단 우선' | '관리자 지정' | '환불계좌 우선';
export type RefundPeriodBasis = '제한 없음' | '거래 완료 후' | '반품 완료 후';
export type RefundCalcMode = '시스템 자동 계산' | '관리자 직접 입력';
export type RefundCompletionBasis = 'PG 취소 성공 시' | '관리자 지급 처리 시' | '은행 출금 확인 시';
export type ShippingFullPolicy = '배송비 반환' | '배송비 미반환' | '조건에 따라 계산';
export type ShippingPartialPolicy = '잔여 주문 기준 재계산' | '원 배송비 유지';
export type DiscountRecalcPolicy = '기존 할인 배분 기준' | '잔여 주문 기준 재계산' | '할인 정책에 위임';
export type ApprovalRequirement = '사용 안 함' | '조건부' | '모든 환불';
export type RefundType = '전체 환불' | '부분 환불' | '과입금 반환' | '조정 환불';
export type RefundScope = 'full' | 'partial';

export interface RefundPolicy {
  fullRefundEnabled: boolean;
  partialRefundEnabled: boolean;
  refundMethodBasis: RefundMethodBasis;
  refundPeriodBasis: RefundPeriodBasis;
  refundPeriodDays: number;
  refundProcessingDays: number;
  refundCalcMode: RefundCalcMode;
  refundCompletionBasis: RefundCompletionBasis;

  shippingFullPolicy: ShippingFullPolicy;
  shippingPartialPolicy: ShippingPartialPolicy;
  freeShippingThreshold: number;
  discountRecalcPolicy: DiscountRecalcPolicy;

  approvalRequired: ApprovalRequirement;
  approvalThresholdAmount: number;

  failureRetryEnabled: boolean;
  autoRetryEnabled: boolean;
  maxRetryCount: number;

  notifyOnRefundEvents: boolean;
}

export interface RefundMethodRule {
  id: string;
  name: string;
  active: boolean;
  defaultAction: string;
  pg: string | null;
  requiresPg: boolean;
  order: number;
}

export interface RefundReason {
  id: string;
  label: string;
  type: RefundType;
  active: boolean;
  order: number;
  requiresDetail: boolean;
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

export const PG_OPTIONS = ['PG 01', 'PG 02', '없음'];

export const INITIAL_POLICY: RefundPolicy = {
  fullRefundEnabled: true,
  partialRefundEnabled: true,
  refundMethodBasis: '원 결제수단 우선',
  refundPeriodBasis: '반품 완료 후',
  refundPeriodDays: 7,
  refundProcessingDays: 3,
  refundCalcMode: '시스템 자동 계산',
  refundCompletionBasis: 'PG 취소 성공 시',

  shippingFullPolicy: '조건에 따라 계산',
  shippingPartialPolicy: '잔여 주문 기준 재계산',
  freeShippingThreshold: 50000,
  discountRecalcPolicy: '잔여 주문 기준 재계산',

  approvalRequired: '조건부',
  approvalThresholdAmount: 1000000,

  failureRetryEnabled: true,
  autoRetryEnabled: false,
  maxRetryCount: 3,

  notifyOnRefundEvents: true,
};

export const INITIAL_METHOD_RULES: RefundMethodRule[] = [
  { id: 'CARD', name: '카드', active: true, defaultAction: '원 승인 취소 (PG 자동 환불)', pg: null, requiresPg: true, order: 1 },
  { id: 'BANK_TRANSFER', name: '계좌이체', active: true, defaultAction: '원거래 취소 또는 계좌 환불', pg: 'PG 02', requiresPg: false, order: 2 },
  { id: 'VIRTUAL_ACCOUNT', name: '가상계좌', active: true, defaultAction: '환불계좌 지급', pg: null, requiresPg: false, order: 3 },
  { id: 'DEPOSIT', name: '무통장입금', active: true, defaultAction: '환불계좌 지급', pg: null, requiresPg: false, order: 4 },
];

export const INITIAL_REASONS: RefundReason[] = [
  { id: 'R1', label: '단순 변심', type: '전체 환불', active: true, order: 1, requiresDetail: false },
  { id: 'R2', label: '주문 취소', type: '전체 환불', active: true, order: 2, requiresDetail: false },
  { id: 'R3', label: '상품 불량', type: '부분 환불', active: true, order: 3, requiresDetail: false },
  { id: 'R4', label: '배송 실패', type: '부분 환불', active: true, order: 4, requiresDetail: false },
  { id: 'R5', label: '중복 결제', type: '조정 환불', active: true, order: 5, requiresDetail: false },
  { id: 'R6', label: '과결제', type: '과입금 반환', active: true, order: 6, requiresDetail: false },
  { id: 'R7', label: '운영 오류', type: '조정 환불', active: true, order: 7, requiresDetail: false },
  { id: 'R8', label: '기타', type: '조정 환불', active: true, order: 8, requiresDetail: true },
];

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-08-12 15:40', by: 'admin02', field: '부분환불 시 배송비', before: '원 배송비 유지', after: '잔여 주문 기준 재계산', reason: '무료배송 조건 미충족 시 배송비 누락 방지' },
  { id: 'H-2', at: '2026-07-22 11:05', by: 'admin01', field: '환불 승인 기준금액', before: '500,000원', after: '1,000,000원', reason: '소액 환불 처리 지연 개선' },
];

export interface RefundTestOrder {
  id: string;
  target: string;
  method: string;
  productAmount: number;
  shippingFee: number;
  discount: number;
  discountThreshold: number;
  alreadyRefunded: number;
  partialItemLabel: string;
  partialItemAmount: number;
}

export const TEST_ORDERS: RefundTestOrder[] = [
  { id: 'O-00591', target: '회사 03', method: '카드', productAmount: 100000, shippingFee: 3000, discount: 10000, discountThreshold: 50000, alreadyRefunded: 0, partialItemLabel: '상품 01 (2개)', partialItemAmount: 60000 },
  { id: 'O-00588', target: '회사 07', method: '가상계좌', productAmount: 415000, shippingFee: 0, discount: 0, discountThreshold: 0, alreadyRefunded: 0, partialItemLabel: '상품 A', partialItemAmount: 200000 },
  { id: 'O-00579', target: '회사 01', method: '무통장입금', productAmount: 1900000, shippingFee: 0, discount: 190000, discountThreshold: 1000000, alreadyRefunded: 500000, partialItemLabel: '상품 B (1개)', partialItemAmount: 700000 },
  { id: 'O-00602', target: '회사 05', method: '계좌이체', productAmount: 3200000, shippingFee: 5000, discount: 0, discountThreshold: 0, alreadyRefunded: 0, partialItemLabel: '상품 C', partialItemAmount: 1000000 },
];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export interface RefundBreakdownItem {
  label: string;
  amount: number;
}

export interface RefundBreakdown {
  items: RefundBreakdownItem[];
  rawTotal: number;
  total: number;
  availableMax: number;
  capped: boolean;
  methodAction: string;
  methodPg: string | null;
  approvalNeeded: boolean;
}

export function computeRefundBreakdown(order: RefundTestOrder, scope: RefundScope, policy: RefundPolicy, methodRules: RefundMethodRule[]): RefundBreakdown {
  const items: RefundBreakdownItem[] = [];
  const targetAmount = scope === 'full' ? order.productAmount : order.partialItemAmount;
  items.push({ label: scope === 'full' ? '취소 상품금액' : `취소 상품금액 (${order.partialItemLabel})`, amount: targetAmount });

  let shippingAdj = 0;
  if (scope === 'full') {
    if (policy.shippingFullPolicy === '배송비 미반환') shippingAdj = 0;
    else shippingAdj = order.shippingFee;
  } else if (policy.shippingPartialPolicy === '잔여 주문 기준 재계산') {
    const remaining = order.productAmount - order.partialItemAmount;
    shippingAdj = remaining < policy.freeShippingThreshold && order.shippingFee === 0 ? -3000 : 0;
  }
  if (shippingAdj !== 0) items.push({ label: '배송비 조정', amount: shippingAdj });

  let discountAdj = 0;
  if (scope === 'full') {
    discountAdj = -order.discount;
  } else if (order.discount > 0) {
    if (policy.discountRecalcPolicy === '기존 할인 배분 기준') {
      discountAdj = -Math.round(order.discount * (order.partialItemAmount / order.productAmount));
    } else if (policy.discountRecalcPolicy === '잔여 주문 기준 재계산') {
      const remaining = order.productAmount - order.partialItemAmount;
      discountAdj = remaining < order.discountThreshold ? -order.discount : 0;
    }
  }
  if (discountAdj !== 0) items.push({ label: '할인 조정', amount: discountAdj });

  const rawTotal = items.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = order.productAmount + order.shippingFee - order.discount;
  const availableMax = Math.max(paidAmount - order.alreadyRefunded, 0);
  const capped = rawTotal > availableMax || rawTotal < 0;
  const total = Math.min(Math.max(rawTotal, 0), availableMax);

  const rule = methodRules.find((m) => m.name === order.method);
  const approvalNeeded = policy.approvalRequired === '모든 환불' || (policy.approvalRequired === '조건부' && total >= policy.approvalThresholdAmount);

  return { items, rawTotal, total, availableMax, capped, methodAction: rule?.defaultAction ?? '-', methodPg: rule?.pg ?? null, approvalNeeded };
}

export interface ValidationWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: RefundPolicy, methodRules: RefundMethodRule[], reasons: RefundReason[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  methodRules.forEach((m) => {
    if (m.active && m.requiresPg && !m.pg) {
      warnings.push({ id: `no-pg-${m.id}`, message: `'${m.name}' 환불을 사용하지만 연결된 PG가 없습니다.` });
    }
  });

  if (!policy.fullRefundEnabled && !policy.partialRefundEnabled) {
    warnings.push({ id: 'no-refund', message: '전체 환불과 부분 환불이 모두 비활성화되어 있습니다.' });
  }
  if (reasons.filter((r) => r.active).length === 0) {
    warnings.push({ id: 'no-reason', message: '노출 가능한 환불 사유가 없습니다.' });
  }
  if (policy.approvalRequired === '조건부' && policy.approvalThresholdAmount <= 0) {
    warnings.push({ id: 'approval-zero', message: '환불 승인 기준금액이 0원 이하로 설정되어 모든 환불에 승인이 필요합니다.' });
  }
  if (policy.refundProcessingDays <= 0) {
    warnings.push({ id: 'processing-zero', message: '환불 처리기한이 설정되지 않았습니다.' });
  }

  return warnings;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof RefundPolicy; label: string; format: (p: RefundPolicy) => string }[] = [
  { key: 'fullRefundEnabled', label: '전체 환불', format: (p) => (p.fullRefundEnabled ? '허용' : '불가') },
  { key: 'partialRefundEnabled', label: '부분 환불', format: (p) => (p.partialRefundEnabled ? '허용' : '불가') },
  { key: 'refundMethodBasis', label: '환불 처리 방식', format: (p) => p.refundMethodBasis },
  { key: 'refundPeriodBasis', label: '환불 가능기간 기준', format: (p) => p.refundPeriodBasis },
  { key: 'refundPeriodDays', label: '환불 가능기간', format: (p) => `${p.refundPeriodDays}일` },
  { key: 'refundProcessingDays', label: '환불 처리기한', format: (p) => `승인 후 ${p.refundProcessingDays}영업일` },
  { key: 'refundCalcMode', label: '환불금액 계산', format: (p) => p.refundCalcMode },
  { key: 'refundCompletionBasis', label: '환불 완료 기준', format: (p) => p.refundCompletionBasis },
  { key: 'shippingFullPolicy', label: '전체환불 배송비', format: (p) => p.shippingFullPolicy },
  { key: 'shippingPartialPolicy', label: '부분환불 배송비', format: (p) => p.shippingPartialPolicy },
  { key: 'freeShippingThreshold', label: '무료배송 기준금액', format: (p) => fmtWon(p.freeShippingThreshold) },
  { key: 'discountRecalcPolicy', label: '부분환불 할인 재계산', format: (p) => p.discountRecalcPolicy },
  { key: 'approvalRequired', label: '환불 승인', format: (p) => p.approvalRequired },
  { key: 'approvalThresholdAmount', label: '환불 승인 기준금액', format: (p) => fmtWon(p.approvalThresholdAmount) },
  { key: 'failureRetryEnabled', label: '환불 실패 재시도', format: (p) => (p.failureRetryEnabled ? '허용' : '불가') },
  { key: 'autoRetryEnabled', label: '자동 재시도', format: (p) => (p.autoRetryEnabled ? '사용' : '사용 안 함') },
  { key: 'maxRetryCount', label: '최대 자동 재시도', format: (p) => `${p.maxRetryCount}회` },
  { key: 'notifyOnRefundEvents', label: '환불 이벤트 알림', format: (p) => (p.notifyOnRefundEvents ? '사용' : '사용 안 함') },
];

export function describePolicyChanges(before: RefundPolicy, after: RefundPolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => before[key] !== after[key]).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export function describeMethodChanges(before: RefundMethodRule[], after: RefundMethodRule[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  after.forEach((m) => {
    const prev = before.find((b) => b.id === m.id);
    if (!prev) return;
    if (prev.active !== m.active) diffs.push({ field: `${m.name} 사용 여부`, before: prev.active ? '사용' : '비활성', after: m.active ? '사용' : '비활성' });
    if (prev.pg !== m.pg) diffs.push({ field: `${m.name} 연동 PG`, before: prev.pg ?? '없음', after: m.pg ?? '없음' });
  });
  return diffs;
}

export function describeReasonChanges(before: RefundReason[], after: RefundReason[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  after.forEach((r) => {
    const prev = before.find((b) => b.id === r.id);
    if (!prev) {
      diffs.push({ field: '환불 사유 추가', before: '-', after: r.label });
      return;
    }
    if (prev.active !== r.active) diffs.push({ field: `${r.label} 노출`, before: prev.active ? '노출' : '비노출', after: r.active ? '노출' : '비노출' });
    if (prev.label !== r.label) diffs.push({ field: '환불 사유명', before: prev.label, after: r.label });
    if (prev.type !== r.type) diffs.push({ field: `${r.label} 유형`, before: prev.type, after: r.type });
  });
  before.forEach((r) => {
    if (!after.find((a) => a.id === r.id)) diffs.push({ field: '환불 사유 삭제', before: r.label, after: '-' });
  });
  return diffs;
}
