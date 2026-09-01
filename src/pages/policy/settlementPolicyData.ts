export type SettlementTargetBasis = '결제 완료' | '주문 완료' | '배송 완료' | '거래 확정' | '구매 확정';
export type SettlementDateBasis = '정산 대상 확정일' | '주문일' | '결제일' | '배송 완료일' | '구매 확정일';
export type SettlementCycle = '매일' | '주 1회' | '월 1회' | '직접 설정';
export type SettlementCreationTiming = '마감일 이후 자동 생성' | '지급 예정일 기준 자동 생성' | '관리자 직접 생성';
export type PreCloseCancelPolicy = '해당 정산에서 제외' | '다음 정산에서 차감';
export type PostConfirmRefundPolicy = '다음 정산에서 자동 차감' | '별도 조정 승인 후 반영';
export type ConfirmMode = '관리자 수동 확정' | '조건 충족 시 자동 확정';
export type ShortfallPolicy = '다음 정산으로 이월' | '그대로 지급' | '관리자 확인';
export type NegativeSettlementPolicy = '다음 정산으로 이월' | '지급 보류' | '관리자 확인';
export type HolidayPolicy = '이전 영업일' | '다음 영업일' | '날짜 유지';
export type PayMethod = '계좌이체' | '외부 지급시스템' | '수동 지급';
export type SettlementAmountBasis = '공급가액' | '공급가액 + 세액';

export interface SettlementPolicy {
  settlementEnabled: boolean;
  targetBasis: SettlementTargetBasis;
  dateBasis: SettlementDateBasis;
  autoCreateEnabled: boolean;
  creationTiming: SettlementCreationTiming;

  cycle: SettlementCycle;
  closingDayOfMonth: number;
  payDayOfMonth: number;
  payOffsetDays: number;
  holidayPolicy: HolidayPolicy;
  payMethod: PayMethod;

  amountBasis: SettlementAmountBasis;
  includeShippingFee: boolean;
  includeOtherServiceAmount: boolean;
  deductCancel: boolean;
  deductRefund: boolean;
  deductFee: boolean;
  deductDiscountShare: boolean;
  includeAdjustment: boolean;
  includeCarryOver: boolean;

  preCloseCancelPolicy: PreCloseCancelPolicy;
  postConfirmRefundPolicy: PostConfirmRefundPolicy;

  confirmMode: ConfirmMode;
  requireNoUnsettledTx: boolean;
  requireNoUnprocessedRefund: boolean;
  requireNoUnapprovedAdjustment: boolean;
  requirePayoutInfo: boolean;

  minPayoutAmount: number;
  shortfallPolicy: ShortfallPolicy;
  negativeSettlementPolicy: NegativeSettlementPolicy;

  failureRetryEnabled: boolean;
  autoRetryEnabled: boolean;
  maxRetryCount: number;
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

export interface LastModified {
  at: string;
  by: string;
}

export const INITIAL_LAST_MODIFIED: LastModified = { at: '2026-08-25', by: '운영 관리자' };

export const INITIAL_POLICY: SettlementPolicy = {
  settlementEnabled: true,
  targetBasis: '배송 완료',
  dateBasis: '배송 완료일',
  autoCreateEnabled: true,
  creationTiming: '마감일 이후 자동 생성',

  cycle: '월 1회',
  closingDayOfMonth: 0,
  payDayOfMonth: 15,
  payOffsetDays: 10,
  holidayPolicy: '다음 영업일',
  payMethod: '계좌이체',

  amountBasis: '공급가액 + 세액',
  includeShippingFee: true,
  includeOtherServiceAmount: false,
  deductCancel: true,
  deductRefund: true,
  deductFee: true,
  deductDiscountShare: false,
  includeAdjustment: true,
  includeCarryOver: true,

  preCloseCancelPolicy: '해당 정산에서 제외',
  postConfirmRefundPolicy: '다음 정산에서 자동 차감',

  confirmMode: '조건 충족 시 자동 확정',
  requireNoUnsettledTx: true,
  requireNoUnprocessedRefund: true,
  requireNoUnapprovedAdjustment: true,
  requirePayoutInfo: false,

  minPayoutAmount: 50000,
  shortfallPolicy: '다음 정산으로 이월',
  negativeSettlementPolicy: '다음 정산으로 이월',

  failureRetryEnabled: true,
  autoRetryEnabled: false,
  maxRetryCount: 3,
};

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-08-05 10:20', by: 'admin02', field: '지급 예정일', before: '익월 10일', after: '익월 15일', reason: '정산 검토 기간 확보' },
  { id: 'H-2', at: '2026-07-18 16:00', by: 'admin01', field: '정산 대상 기준', before: '결제 완료', after: '배송 완료', reason: '결제 직후 취소 발생 시 정산 재조정 부담 감소' },
];

export interface SettlementExcludedGroup {
  label: string;
  count: number;
}

export interface SettlementTestTarget {
  id: string;
  name: string;
  period: string;
  txCount: number;
  grossAmount: number;
  cancelAmount: number;
  refundAmount: number;
  feeAmount: number;
  adjustmentAmount: number;
  carryOverAmount: number;
  payDateBase: string;
  excluded: SettlementExcludedGroup[];
}

export const TEST_TARGETS: SettlementTestTarget[] = [
  {
    id: 'SET-PREVIEW-01', name: '회사 03', period: '2026-09-01 ~ 2026-09-30', txCount: 128,
    grossAmount: 12800000, cancelAmount: 200000, refundAmount: 120000, feeAmount: 640000, adjustmentAmount: 10000, carryOverAmount: 0,
    payDateBase: '2026-10-15',
    excluded: [{ label: '배송 미완료', count: 3 }, { label: '환불 처리중', count: 2 }],
  },
  {
    id: 'SET-PREVIEW-02', name: '회사 07', period: '2026-09-01 ~ 2026-09-30', txCount: 4,
    grossAmount: 32000, cancelAmount: 0, refundAmount: 0, feeAmount: 1600, adjustmentAmount: 0, carryOverAmount: 0,
    payDateBase: '2026-10-15',
    excluded: [],
  },
  {
    id: 'SET-PREVIEW-03', name: '회사 01', period: '2026-09-01 ~ 2026-09-30', txCount: 6,
    grossAmount: 400000, cancelAmount: 0, refundAmount: 650000, feeAmount: 20000, adjustmentAmount: 0, carryOverAmount: -80000,
    payDateBase: '2026-10-18',
    excluded: [{ label: '정산 보류 거래', count: 1 }],
  },
];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function signed(n: number): string {
  if (n === 0) return '0원';
  return (n > 0 ? '+' : '-') + fmtWon(Math.abs(n));
}

export interface SettlementBreakdownItem {
  label: string;
  amount: number;
}

export interface SettlementBreakdown {
  items: SettlementBreakdownItem[];
  rawTotal: number;
  payoutAmount: number;
  carryOverToNext: number;
  status: '지급 대상' | '최소금액 미달 · 이월' | '마이너스 정산 · 이월' | '마이너스 정산 · 지급 보류' | '마이너스 정산 · 관리자 확인 필요';
  payDate: string;
  payDateShifted: boolean;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

function resolvePayDate(base: string, policy: SettlementPolicy): { text: string; shifted: boolean } {
  const d = new Date(base + 'T00:00:00');
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  if (!isWeekend || policy.holidayPolicy === '날짜 유지') return { text: fmtDate(d), shifted: false };
  const shifted = new Date(d);
  while (shifted.getDay() === 0 || shifted.getDay() === 6) {
    shifted.setDate(shifted.getDate() + (policy.holidayPolicy === '다음 영업일' ? 1 : -1));
  }
  return { text: fmtDate(shifted), shifted: true };
}

export function computeSettlementBreakdown(target: SettlementTestTarget, policy: SettlementPolicy): SettlementBreakdown {
  const items: SettlementBreakdownItem[] = [{ label: '거래금액', amount: target.grossAmount }];
  if (policy.deductCancel && target.cancelAmount > 0) items.push({ label: '취소', amount: -target.cancelAmount });
  if (policy.deductRefund && target.refundAmount > 0) items.push({ label: '환불', amount: -target.refundAmount });
  if (policy.deductFee && target.feeAmount > 0) items.push({ label: '수수료', amount: -target.feeAmount });
  if (policy.includeAdjustment && target.adjustmentAmount !== 0) items.push({ label: '조정', amount: target.adjustmentAmount });
  if (policy.includeCarryOver && target.carryOverAmount !== 0) items.push({ label: '이전 이월', amount: target.carryOverAmount });

  const rawTotal = items.reduce((sum, i) => sum + i.amount, 0);
  const { text: payDate, shifted: payDateShifted } = resolvePayDate(target.payDateBase, policy);

  if (rawTotal < 0) {
    const status = policy.negativeSettlementPolicy === '다음 정산으로 이월' ? '마이너스 정산 · 이월' : policy.negativeSettlementPolicy === '지급 보류' ? '마이너스 정산 · 지급 보류' : '마이너스 정산 · 관리자 확인 필요';
    return { items, rawTotal, payoutAmount: 0, carryOverToNext: policy.negativeSettlementPolicy === '다음 정산으로 이월' ? rawTotal : 0, status, payDate, payDateShifted };
  }
  if (rawTotal < policy.minPayoutAmount) {
    if (policy.shortfallPolicy === '그대로 지급') {
      return { items, rawTotal, payoutAmount: rawTotal, carryOverToNext: 0, status: '지급 대상', payDate, payDateShifted };
    }
    return { items, rawTotal, payoutAmount: 0, carryOverToNext: policy.shortfallPolicy === '다음 정산으로 이월' ? rawTotal : 0, status: '최소금액 미달 · 이월', payDate, payDateShifted };
  }
  return { items, rawTotal, payoutAmount: rawTotal, carryOverToNext: 0, status: '지급 대상', payDate, payDateShifted };
}

export interface ValidationWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: SettlementPolicy): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (policy.confirmMode === '조건 충족 시 자동 확정' && (!policy.requireNoUnsettledTx || !policy.requireNoUnprocessedRefund || !policy.requireNoUnapprovedAdjustment || !policy.requirePayoutInfo)) {
    warnings.push({ id: 'auto-confirm-gap', message: '자동 확정 방식이지만 확정 필수 조건 중 일부가 비활성화되어 있어 검증 없이 자동 확정될 수 있습니다.' });
  }
  if (policy.cycle !== '월 1회' && policy.payOffsetDays <= 0) {
    warnings.push({ id: 'pay-before-close', message: '지급 예정일이 마감일보다 빠르거나 같습니다.' });
  }
  if (!policy.deductFee && !policy.deductRefund && !policy.deductCancel && !policy.includeShippingFee && !policy.includeOtherServiceAmount) {
    warnings.push({ id: 'no-amount-items', message: '정산금액 구성 항목이 거의 설정되어 있지 않습니다.' });
  }
  if (policy.failureRetryEnabled && policy.autoRetryEnabled && policy.maxRetryCount <= 0) {
    warnings.push({ id: 'retry-zero', message: '자동 재시도가 사용 중이지만 최대 재시도 횟수가 0회입니다.' });
  }

  return warnings;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof SettlementPolicy; label: string; format: (p: SettlementPolicy) => string }[] = [
  { key: 'settlementEnabled', label: '정산 사용', format: (p) => (p.settlementEnabled ? '사용' : '사용 안 함') },
  { key: 'targetBasis', label: '정산 대상 기준', format: (p) => p.targetBasis },
  { key: 'dateBasis', label: '정산 기준일', format: (p) => p.dateBasis },
  { key: 'autoCreateEnabled', label: '정산 자동 생성', format: (p) => (p.autoCreateEnabled ? '사용' : '관리자 수동 생성') },
  { key: 'creationTiming', label: '정산 생성 시점', format: (p) => p.creationTiming },
  { key: 'cycle', label: '정산 주기', format: (p) => p.cycle },
  { key: 'closingDayOfMonth', label: '정산 마감일', format: (p) => (p.closingDayOfMonth === 0 ? '매월 말일' : `매월 ${p.closingDayOfMonth}일`) },
  { key: 'payDayOfMonth', label: '지급 예정일(월정산)', format: (p) => (p.payDayOfMonth === 0 ? '익월 말일' : `익월 ${p.payDayOfMonth}일`) },
  { key: 'payOffsetDays', label: '지급 예정일(마감 후)', format: (p) => `마감 후 ${p.payOffsetDays}영업일` },
  { key: 'holidayPolicy', label: '지급일 휴일 처리', format: (p) => p.holidayPolicy },
  { key: 'payMethod', label: '지급 방법', format: (p) => p.payMethod },
  { key: 'amountBasis', label: '정산 기준금액', format: (p) => p.amountBasis },
  { key: 'includeShippingFee', label: '배송비 포함', format: (p) => (p.includeShippingFee ? '포함' : '제외') },
  { key: 'includeOtherServiceAmount', label: '기타 서비스금액 포함', format: (p) => (p.includeOtherServiceAmount ? '포함' : '제외') },
  { key: 'deductCancel', label: '취소 차감', format: (p) => (p.deductCancel ? '차감' : '미차감') },
  { key: 'deductRefund', label: '환불 차감', format: (p) => (p.deductRefund ? '차감' : '미차감') },
  { key: 'deductFee', label: '수수료 차감', format: (p) => (p.deductFee ? '차감' : '미차감') },
  { key: 'deductDiscountShare', label: '할인 분담액 차감', format: (p) => (p.deductDiscountShare ? '차감' : '미차감') },
  { key: 'includeAdjustment', label: '조정금액 반영', format: (p) => (p.includeAdjustment ? '반영' : '미반영') },
  { key: 'includeCarryOver', label: '이월금 반영', format: (p) => (p.includeCarryOver ? '반영' : '미반영') },
  { key: 'preCloseCancelPolicy', label: '마감 전 취소 반영', format: (p) => p.preCloseCancelPolicy },
  { key: 'postConfirmRefundPolicy', label: '확정 후 환불 반영', format: (p) => p.postConfirmRefundPolicy },
  { key: 'confirmMode', label: '정산 확정 방식', format: (p) => p.confirmMode },
  { key: 'requireNoUnsettledTx', label: '확정조건 · 미확정 거래 없음', format: (p) => (p.requireNoUnsettledTx ? '필수' : '미적용') },
  { key: 'requireNoUnprocessedRefund', label: '확정조건 · 미처리 환불 없음', format: (p) => (p.requireNoUnprocessedRefund ? '필수' : '미적용') },
  { key: 'requireNoUnapprovedAdjustment', label: '확정조건 · 미승인 조정 없음', format: (p) => (p.requireNoUnapprovedAdjustment ? '필수' : '미적용') },
  { key: 'requirePayoutInfo', label: '확정조건 · 지급정보 존재', format: (p) => (p.requirePayoutInfo ? '필수' : '미적용') },
  { key: 'minPayoutAmount', label: '최소 지급금액', format: (p) => fmtWon(p.minPayoutAmount) },
  { key: 'shortfallPolicy', label: '최소금액 미달 처리', format: (p) => p.shortfallPolicy },
  { key: 'negativeSettlementPolicy', label: '마이너스 정산 처리', format: (p) => p.negativeSettlementPolicy },
  { key: 'failureRetryEnabled', label: '지급 실패 재시도', format: (p) => (p.failureRetryEnabled ? '허용' : '불가') },
  { key: 'autoRetryEnabled', label: '자동 재시도', format: (p) => (p.autoRetryEnabled ? '사용' : '사용 안 함') },
  { key: 'maxRetryCount', label: '최대 자동 재시도', format: (p) => `${p.maxRetryCount}회` },
];

export function describePolicyChanges(before: SettlementPolicy, after: SettlementPolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => before[key] !== after[key]).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export { signed };
