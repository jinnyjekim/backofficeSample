export type EarnBasis = '할인 전 상품금액' | '할인 적용 후 상품금액' | '실제 결제금액';
export type EarnConfirmTiming = '결제 완료' | '배송 완료' | '구매 확정' | '배송 완료 후 N일';
export type ValidityType = '지급일로부터 N일' | '소멸 없음';
export type UsagePriority = '소멸 예정일이 빠른 포인트부터' | '지급일이 빠른 포인트부터';
export type ExpiredRestorePolicy = '복원하지 않음' | '원 만료일로 복원';
export type RoundingMode = '버림' | '반올림' | '올림';
export type RoundingUnit = 1 | 10 | 100;
export type WithdrawalPolicy = '전액 소멸' | '유지';

export const TODAY = '2026-08-26';

export interface PolicyChange {
  field: string;
  before: string;
  after: string;
}

export interface PolicyHistoryEntry {
  id: string;
  at: string;
  by: string;
  reason: string;
  changes: PolicyChange[];
}

export interface PointPolicy {
  purchaseEarnEnabled: boolean;
  earnRate: number;
  earnBasis: EarnBasis;
  excludePointUsedFromEarnBasis: boolean;
  includeShippingInEarnBasis: boolean;
  earnConfirmTiming: EarnConfirmTiming;
  earnConfirmDays: number;
  immediateAfterConfirm: boolean;
  availableAfterConfirmDays: number;

  useEnabled: boolean;
  minUsePoint: number;
  useUnit: number;
  maxUseAmount: number;
  maxUseRatioPercent: number;

  validityType: ValidityType;
  validityDays: number;
  usagePriority: UsagePriority;

  fullCancelRestoreUsed: boolean;
  fullCancelRevokeEarned: boolean;
  partialCancelRecalculate: boolean;
  fullReturnRestoreUsed: boolean;
  fullReturnRevokeEarned: boolean;
  expiredRestorePolicy: ExpiredRestorePolicy;

  roundingMode: RoundingMode;
  roundingUnit: RoundingUnit;

  withdrawalPolicy: WithdrawalPolicy;

  updatedAt: string;
  updatedBy: string;
}

export const INITIAL_POLICY: PointPolicy = {
  purchaseEarnEnabled: true,
  earnRate: 1,
  earnBasis: '할인 적용 후 상품금액',
  excludePointUsedFromEarnBasis: true,
  includeShippingInEarnBasis: false,
  earnConfirmTiming: '구매 확정',
  earnConfirmDays: 7,
  immediateAfterConfirm: true,
  availableAfterConfirmDays: 0,

  useEnabled: true,
  minUsePoint: 1000,
  useUnit: 1,
  maxUseAmount: 0,
  maxUseRatioPercent: 50,

  validityType: '지급일로부터 N일',
  validityDays: 365,
  usagePriority: '소멸 예정일이 빠른 포인트부터',

  fullCancelRestoreUsed: true,
  fullCancelRevokeEarned: true,
  partialCancelRecalculate: true,
  fullReturnRestoreUsed: true,
  fullReturnRevokeEarned: true,
  expiredRestorePolicy: '복원하지 않음',

  roundingMode: '버림',
  roundingUnit: 1,

  withdrawalPolicy: '전액 소멸',

  updatedAt: '2026-08-01',
  updatedBy: 'admin01',
};

const FIELD_LABELS: { key: keyof PointPolicy; label: string; format: (p: PointPolicy) => string }[] = [
  { key: 'purchaseEarnEnabled', label: '구매 적립', format: (p) => (p.purchaseEarnEnabled ? '사용' : '사용 안 함') },
  { key: 'earnRate', label: '기본 적립률', format: (p) => `${p.earnRate}%` },
  { key: 'earnBasis', label: '적립 기준금액', format: (p) => p.earnBasis },
  { key: 'excludePointUsedFromEarnBasis', label: '포인트 사용금액', format: (p) => (p.excludePointUsedFromEarnBasis ? '적립 대상에서 제외' : '적립 대상에 포함') },
  { key: 'includeShippingInEarnBasis', label: '배송비 적립 기준 포함', format: (p) => (p.includeShippingInEarnBasis ? '포함' : '제외') },
  { key: 'earnConfirmTiming', label: '적립 확정 시점', format: (p) => (p.earnConfirmTiming === '배송 완료 후 N일' ? `배송 완료 후 ${p.earnConfirmDays}일` : p.earnConfirmTiming) },
  { key: 'immediateAfterConfirm', label: '확정 후 사용 가능', format: (p) => (p.immediateAfterConfirm ? '즉시' : `${p.availableAfterConfirmDays}일 후`) },
  { key: 'useEnabled', label: '포인트 사용', format: (p) => (p.useEnabled ? '사용' : '사용 안 함') },
  { key: 'minUsePoint', label: '최소 사용 포인트', format: (p) => `${p.minUsePoint.toLocaleString('ko-KR')}P` },
  { key: 'useUnit', label: '사용 단위', format: (p) => `${p.useUnit}P` },
  { key: 'maxUseAmount', label: '주문당 최대 사용금액', format: (p) => (p.maxUseAmount > 0 ? `${p.maxUseAmount.toLocaleString('ko-KR')}P` : '제한 없음') },
  { key: 'maxUseRatioPercent', label: '주문금액 대비 최대 사용 비율', format: (p) => (p.maxUseRatioPercent > 0 ? `${p.maxUseRatioPercent}%` : '제한 없음') },
  { key: 'validityType', label: '포인트 유효기간', format: (p) => (p.validityType === '지급일로부터 N일' ? `지급일로부터 ${p.validityDays}일` : '소멸 없음') },
  { key: 'usagePriority', label: '사용 우선순위', format: (p) => p.usagePriority },
  { key: 'fullCancelRestoreUsed', label: '전체 취소 시 사용 포인트', format: (p) => (p.fullCancelRestoreUsed ? '복원' : '복원하지 않음') },
  { key: 'fullCancelRevokeEarned', label: '전체 취소 시 적립 포인트', format: (p) => (p.fullCancelRevokeEarned ? '취소/회수' : '유지') },
  { key: 'partialCancelRecalculate', label: '부분 취소/반품 시 적립', format: (p) => (p.partialCancelRecalculate ? '잔여 주문 기준 재계산' : '기존 적립 유지') },
  { key: 'fullReturnRestoreUsed', label: '전체 반품 시 사용 포인트', format: (p) => (p.fullReturnRestoreUsed ? '복원' : '복원하지 않음') },
  { key: 'fullReturnRevokeEarned', label: '전체 반품 시 적립 포인트', format: (p) => (p.fullReturnRevokeEarned ? '회수' : '유지') },
  { key: 'expiredRestorePolicy', label: '만료 포인트 복원', format: (p) => p.expiredRestorePolicy },
  { key: 'roundingMode', label: '적립 계산 소수점', format: (p) => p.roundingMode },
  { key: 'roundingUnit', label: '절사 단위', format: (p) => `${p.roundingUnit}P` },
  { key: 'withdrawalPolicy', label: '회원 탈퇴 시 잔여 포인트', format: (p) => p.withdrawalPolicy },
];

export function describeChanges(before: PointPolicy, after: PointPolicy): PolicyChange[] {
  return FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({
    field: label,
    before: format(before),
    after: format(after),
  }));
}

export const POLICY_HISTORY: PolicyHistoryEntry[] = [
  {
    id: 'PH-1', at: '2026-08-01 09:00', by: 'admin01', reason: '하반기 적립 정책 정리',
    changes: [{ field: '적립 확정 시점', before: '배송 완료 후 7일', after: '구매 확정' }],
  },
  {
    id: 'PH-2', at: '2026-07-01 10:00', by: 'admin02', reason: '유효기간 정책 통일',
    changes: [{ field: '포인트 유효기간', before: '지급일로부터 180일', after: '지급일로부터 365일' }],
  },
  {
    id: 'PH-3', at: '2026-06-01 09:00', by: 'admin01', reason: '포인트 정책 최초 등록',
    changes: [],
  },
];
