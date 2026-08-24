export type PaymentTiming = '선결제' | '후불' | '선결제 + 후불';
export type PaymentBasis = '최종 주문금액' | '청구 확정금액';
export type ExpiryAction = '재결제 가능' | '주문 자동 취소' | '관리자 확인 필요';
export type FailureOrderAction = '유지' | '결제 실패 상태로 전환' | '주문 취소';
export type ShortagePolicy = '부분결제로 처리' | '결제 확인 차단' | '관리자 확인 필요';
export type AmountChangePolicy = '직접 수정 허용' | '변경 요청 Workflow' | '수정 불가';

export const PAYMENT_STAGES = ['접수', '승인', '확정', '처리'] as const;
export const PG_OPTIONS = ['PG 01', 'PG 02', '없음'];

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  active: boolean;
  isDefault: boolean;
  order: number;
  minAmount: number;
  maxAmount: number | null;
  partialAllowed: boolean;
  autoConfirm: boolean;
  pg: string | null;
}

export interface PaymentPolicy {
  paymentRequired: boolean;
  paymentTiming: PaymentTiming;
  paymentAllowedStages: string[];
  paymentBasis: PaymentBasis;
  sessionExpiryMinutes: number;
  expiryAction: ExpiryAction;
  blockProcessingBeforePaid: boolean;

  partialPaymentEnabled: boolean;
  minPartialAmount: number;
  minPartialRatioPct: number;
  maxPartialCount: number;
  balanceDueDays: number;
  shortagePolicy: ShortagePolicy;

  failureOrderAction: FailureOrderAction;
  retryAllowed: boolean;
  maxRetryCount: number;
  retryLimitMinutes: number;
  autoRequery: boolean;
  requeryMaxCount: number;

  cancelEnabled: boolean;
  amountChangePolicy: AmountChangePolicy;

  manualPaymentEnabled: boolean;
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

export const INITIAL_POLICY: PaymentPolicy = {
  paymentRequired: true,
  paymentTiming: '선결제 + 후불',
  paymentAllowedStages: ['확정'],
  paymentBasis: '최종 주문금액',
  sessionExpiryMinutes: 30,
  expiryAction: '재결제 가능',
  blockProcessingBeforePaid: true,

  partialPaymentEnabled: true,
  minPartialAmount: 10000,
  minPartialRatioPct: 10,
  maxPartialCount: 5,
  balanceDueDays: 7,
  shortagePolicy: '부분결제로 처리',

  failureOrderAction: '유지',
  retryAllowed: true,
  maxRetryCount: 5,
  retryLimitMinutes: 10,
  autoRequery: true,
  requeryMaxCount: 5,

  cancelEnabled: true,
  amountChangePolicy: '변경 요청 Workflow',

  manualPaymentEnabled: true,
};

export const INITIAL_METHODS: PaymentMethod[] = [
  { id: 'CARD', name: '카드', code: 'CARD', active: true, isDefault: true, order: 1, minAmount: 1000, maxAmount: 10000000, partialAllowed: false, autoConfirm: true, pg: 'PG 01' },
  { id: 'BANK_TRANSFER', name: '계좌이체', code: 'BANK_TRANSFER', active: true, isDefault: false, order: 2, minAmount: 1000, maxAmount: null, partialAllowed: true, autoConfirm: false, pg: 'PG 02' },
  { id: 'VIRTUAL_ACCOUNT', name: '가상계좌', code: 'VIRTUAL_ACCOUNT', active: true, isDefault: false, order: 3, minAmount: 1000, maxAmount: 500, partialAllowed: false, autoConfirm: false, pg: 'PG 01' },
  { id: 'DEPOSIT', name: '무통장입금', code: 'DEPOSIT', active: true, isDefault: false, order: 4, minAmount: 1000, maxAmount: null, partialAllowed: true, autoConfirm: false, pg: null },
  { id: 'POSTPAID', name: '후불', code: 'POSTPAID', active: true, isDefault: false, order: 5, minAmount: 0, maxAmount: null, partialAllowed: false, autoConfirm: true, pg: null },
  { id: 'ETC', name: '기타', code: 'ETC', active: false, isDefault: false, order: 6, minAmount: 0, maxAmount: null, partialAllowed: false, autoConfirm: false, pg: null },
];

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-08-01 09:10', by: 'admin02', field: '결제 유효시간', before: '20분', after: '30분', reason: '결제 실패 문의 감소를 위한 조정' },
  { id: 'H-2', at: '2026-07-15 11:00', by: 'admin01', field: '결제수단 노출순서', before: '계좌이체 우선', after: '카드 우선', reason: '카드 결제 비중 증가' },
];

export interface ValidationWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: PaymentPolicy, methods: PaymentMethod[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const active = methods.filter((m) => m.active);

  if (active.length === 0) warnings.push({ id: 'no-active', message: '사용 가능한 결제수단이 없습니다.' });

  const defaultMethod = methods.find((m) => m.isDefault);
  if (defaultMethod && !defaultMethod.active) warnings.push({ id: 'default-inactive', message: `기본 결제수단 '${defaultMethod.name}'이 비활성 상태입니다.` });
  if (defaultMethod && !defaultMethod.pg) warnings.push({ id: 'default-no-pg', message: `기본 결제수단 '${defaultMethod.name}'에 연결된 PG가 없습니다.` });

  active.forEach((m) => {
    if (m.maxAmount !== null && m.maxAmount < m.minAmount) {
      warnings.push({ id: `range-${m.id}`, message: `'${m.name}' 결제 최대금액이 최소금액보다 작습니다.` });
    }
  });

  if (policy.sessionExpiryMinutes <= 0) warnings.push({ id: 'expiry-zero', message: '결제 유효시간이 0분입니다.' });

  if (policy.partialPaymentEnabled) {
    const tooSmallMax = active.find((m) => m.maxAmount !== null && m.maxAmount < policy.minPartialAmount);
    if (tooSmallMax) warnings.push({ id: 'partial-min-too-high', message: `부분결제 최소 결제금액이 '${tooSmallMax.name}'의 최대 결제금액보다 큽니다.` });
  }

  return warnings;
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof PaymentPolicy; label: string; format: (p: PaymentPolicy) => string }[] = [
  { key: 'paymentRequired', label: '결제 필요 여부', format: (p) => (p.paymentRequired ? '결제 필요' : '결제 없이 주문 가능') },
  { key: 'paymentTiming', label: '결제 방식', format: (p) => p.paymentTiming },
  { key: 'paymentAllowedStages', label: '결제 가능 시점', format: (p) => p.paymentAllowedStages.join(', ') || '없음' },
  { key: 'paymentBasis', label: '결제 기준금액', format: (p) => p.paymentBasis },
  { key: 'sessionExpiryMinutes', label: '결제 유효시간', format: (p) => `${p.sessionExpiryMinutes}분` },
  { key: 'expiryAction', label: '유효시간 만료 후', format: (p) => p.expiryAction },
  { key: 'blockProcessingBeforePaid', label: '결제 완료 전 주문 처리', format: (p) => (p.blockProcessingBeforePaid ? '불가' : '허용') },
  { key: 'partialPaymentEnabled', label: '부분결제', format: (p) => (p.partialPaymentEnabled ? '허용' : '불가') },
  { key: 'minPartialAmount', label: '최소 1회 결제금액', format: (p) => fmtWon(p.minPartialAmount) },
  { key: 'minPartialRatioPct', label: '최소 결제 비율', format: (p) => `${p.minPartialRatioPct}%` },
  { key: 'maxPartialCount', label: '최대 결제 횟수', format: (p) => `${p.maxPartialCount}회` },
  { key: 'balanceDueDays', label: '잔액 결제 마감', format: (p) => `주문 확정 후 ${p.balanceDueDays}일` },
  { key: 'shortagePolicy', label: '부족 결제', format: (p) => p.shortagePolicy },
  { key: 'failureOrderAction', label: '실패 시 주문 상태', format: (p) => p.failureOrderAction },
  { key: 'retryAllowed', label: '사용자 재시도', format: (p) => (p.retryAllowed ? '허용' : '불가') },
  { key: 'maxRetryCount', label: '최대 재시도', format: (p) => `${p.maxRetryCount}회` },
  { key: 'retryLimitMinutes', label: '재시도 제한시간', format: (p) => `${p.retryLimitMinutes}분` },
  { key: 'autoRequery', label: '결제 상태 자동 재조회', format: (p) => (p.autoRequery ? '사용' : '사용 안 함') },
  { key: 'requeryMaxCount', label: '재조회 횟수', format: (p) => `${p.requeryMaxCount}회` },
  { key: 'cancelEnabled', label: '결제 취소 기능', format: (p) => (p.cancelEnabled ? '사용' : '사용 안 함') },
  { key: 'amountChangePolicy', label: '결제 완료 후 금액 변경', format: (p) => p.amountChangePolicy },
  { key: 'manualPaymentEnabled', label: '관리자 수동 결제 등록', format: (p) => (p.manualPaymentEnabled ? '허용' : '불가') },
];

export function describePolicyChanges(before: PaymentPolicy, after: PaymentPolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({
    field: label,
    before: format(before),
    after: format(after),
  }));
}

export function describeMethodChanges(before: PaymentMethod[], after: PaymentMethod[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const beforeDefault = before.find((m) => m.isDefault)?.name ?? '없음';
  const afterDefault = after.find((m) => m.isDefault)?.name ?? '없음';
  if (beforeDefault !== afterDefault) diffs.push({ field: '기본 결제수단', before: beforeDefault, after: afterDefault });

  after.forEach((m) => {
    const prev = before.find((b) => b.id === m.id);
    if (!prev) return;
    if (prev.active !== m.active) diffs.push({ field: `${m.name} 사용 여부`, before: prev.active ? '사용' : '비활성', after: m.active ? '사용' : '비활성' });
    if (prev.minAmount !== m.minAmount) diffs.push({ field: `${m.name} 최소 결제금액`, before: fmtWon(prev.minAmount), after: fmtWon(m.minAmount) });
    if (prev.maxAmount !== m.maxAmount) {
      diffs.push({ field: `${m.name} 최대 결제금액`, before: prev.maxAmount === null ? '제한 없음' : fmtWon(prev.maxAmount), after: m.maxAmount === null ? '제한 없음' : fmtWon(m.maxAmount) });
    }
    if (prev.partialAllowed !== m.partialAllowed) diffs.push({ field: `${m.name} 부분결제`, before: prev.partialAllowed ? '허용' : '불가', after: m.partialAllowed ? '허용' : '불가' });
    if (prev.autoConfirm !== m.autoConfirm) diffs.push({ field: `${m.name} 자동 결제확정`, before: prev.autoConfirm ? '사용' : '사용 안 함', after: m.autoConfirm ? '사용' : '사용 안 함' });
    if (prev.pg !== m.pg) diffs.push({ field: `${m.name} PG`, before: prev.pg ?? '없음', after: m.pg ?? '없음' });
  });
  return diffs;
}
