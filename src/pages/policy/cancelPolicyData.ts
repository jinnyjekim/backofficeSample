export type CancelAvailability = '가능' | '조건부' | '불가';
export type ApprovalNeed = '불필요' | '조건부' | '필요';
export type CancelTimingBase = '출고 전' | '주문 처리 시작 전' | '주문 확정 전' | '단계별 설정';
export type PostShipmentAction = '반품 / 회수 절차로 전환' | '관리자 확인' | '요청 차단';
export type WithdrawPolicy = '허용' | '처리 시작 전까지만 허용' | '불가';
export type ReasonAudience = '고객' | '관리자';

export const ORDER_STAGES = ['주문 접수', '승인 대기', '주문 확정', '처리중', '배송 준비', '출고 대기', '출고 완료', '배송중', '배송 완료'];
export const POST_SHIPMENT_STAGES = new Set(['출고 완료', '배송중', '배송 완료']);
export const CANCEL_QUICK_STAGES = ['접수', '승인', '확정', '처리', '출고완료'];

export interface StageCancelRule {
  stage: string;
  customerCancel: CancelAvailability;
  adminCancel: CancelAvailability;
  approval: ApprovalNeed;
}

export interface CancelReason {
  id: string;
  label: string;
  audience: ReasonAudience;
  active: boolean;
  order: number;
  requiresDetail: boolean;
}

export interface CancelPolicy {
  customerCancelEnabled: boolean;
  adminCancelEnabled: boolean;
  fullCancelEnabled: boolean;
  itemLevelPartialEnabled: boolean;
  partialCancelEnabled: boolean;
  defaultTimingBase: CancelTimingBase;
  cancelAllowedStages: string[];
  postShipmentAction: PostShipmentAction;
  withdrawPolicy: WithdrawPolicy;
  autoCancelOrderWhenFullyCancelled: boolean;
  restockOnCancel: boolean;
  notifyOnCancelEvents: boolean;
}

export interface LastModified {
  at: string;
  by: string;
}

export const INITIAL_LAST_MODIFIED: LastModified = { at: '2026-08-10', by: '운영 관리자' };

export interface PolicyHistoryEntry {
  id: string;
  at: string;
  by: string;
  field: string;
  before: string;
  after: string;
  reason: string;
}

export const INITIAL_POLICY: CancelPolicy = {
  customerCancelEnabled: true,
  adminCancelEnabled: true,
  fullCancelEnabled: true,
  itemLevelPartialEnabled: true,
  partialCancelEnabled: true,
  defaultTimingBase: '단계별 설정',
  cancelAllowedStages: ['접수', '승인', '확정'],
  postShipmentAction: '반품 / 회수 절차로 전환',
  withdrawPolicy: '처리 시작 전까지만 허용',
  autoCancelOrderWhenFullyCancelled: true,
  restockOnCancel: true,
  notifyOnCancelEvents: true,
};

export const INITIAL_STAGE_RULES: StageCancelRule[] = [
  { stage: '주문 접수', customerCancel: '가능', adminCancel: '가능', approval: '불필요' },
  { stage: '승인 대기', customerCancel: '가능', adminCancel: '가능', approval: '불필요' },
  { stage: '주문 확정', customerCancel: '가능', adminCancel: '가능', approval: '조건부' },
  { stage: '처리중', customerCancel: '조건부', adminCancel: '가능', approval: '조건부' },
  { stage: '배송 준비', customerCancel: '조건부', adminCancel: '가능', approval: '필요' },
  { stage: '출고 대기', customerCancel: '불가', adminCancel: '조건부', approval: '필요' },
  { stage: '출고 완료', customerCancel: '불가', adminCancel: '조건부', approval: '필요' },
  { stage: '배송중', customerCancel: '불가', adminCancel: '불가', approval: '불필요' },
  { stage: '배송 완료', customerCancel: '불가', adminCancel: '불가', approval: '불필요' },
];

export const INITIAL_REASONS: CancelReason[] = [
  { id: 'R1', label: '단순 변심', audience: '고객', active: true, order: 1, requiresDetail: false },
  { id: 'R2', label: '주문 실수', audience: '고객', active: true, order: 2, requiresDetail: false },
  { id: 'R3', label: '배송지 변경 필요', audience: '고객', active: true, order: 3, requiresDetail: false },
  { id: 'R4', label: '상품 변경', audience: '고객', active: true, order: 4, requiresDetail: false },
  { id: 'R5', label: '중복 주문', audience: '고객', active: true, order: 5, requiresDetail: false },
  { id: 'R6', label: '배송 지연', audience: '고객', active: false, order: 6, requiresDetail: false },
  { id: 'R7', label: '기타', audience: '고객', active: true, order: 7, requiresDetail: true },
  { id: 'R8', label: '고객 요청', audience: '관리자', active: true, order: 1, requiresDetail: false },
  { id: 'R9', label: '재고 부족', audience: '관리자', active: true, order: 2, requiresDetail: false },
  { id: 'R10', label: '결제 오류', audience: '관리자', active: true, order: 3, requiresDetail: false },
  { id: 'R11', label: '가격 오류', audience: '관리자', active: true, order: 4, requiresDetail: false },
  { id: 'R12', label: '중복 주문', audience: '관리자', active: true, order: 5, requiresDetail: false },
  { id: 'R13', label: '계약 조건 오류', audience: '관리자', active: true, order: 6, requiresDetail: false },
  { id: 'R14', label: '운영 처리 오류', audience: '관리자', active: true, order: 7, requiresDetail: false },
  { id: 'R15', label: '기타', audience: '관리자', active: true, order: 8, requiresDetail: true },
];

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-08-10 10:00', by: 'admin01', field: '출고 대기 · 관리자 취소', before: '가능', after: '조건부', reason: '출고 Queue 제거 확인 절차 추가' },
  { id: 'H-2', at: '2026-07-20 09:30', by: 'admin02', field: '취소 요청 철회', before: '허용', after: '처리 시작 전까지만 허용', reason: '후속 처리 시작된 요청의 철회로 인한 정합성 오류 방지' },
];

export interface TestOrder {
  id: string;
  target: string;
  stage: string;
  paid: boolean;
  shipped: boolean;
  contract: string | null;
  amount: number;
}

export const TEST_ORDERS: TestOrder[] = [
  { id: 'O-00591', target: '회사 03', stage: '처리중', paid: true, shipped: false, contract: null, amount: 820000 },
  { id: 'O-00588', target: '회사 07', stage: '출고 대기', paid: true, shipped: false, contract: null, amount: 415000 },
  { id: 'O-00579', target: '회사 01', stage: '배송중', paid: true, shipped: true, contract: null, amount: 1900000 },
  { id: 'O-00602', target: '회사 05', stage: '주문 확정', paid: false, shipped: false, contract: 'CT-00182', amount: 3200000 },
];

export interface EligibilityResult {
  availability: CancelAvailability;
  approvalNeeded: boolean;
  partialAllowed: boolean;
  notes: string[];
}

export function checkEligibility(order: TestOrder, actor: '고객' | '관리자', policy: CancelPolicy, stageRules: StageCancelRule[]): EligibilityResult {
  const notes: string[] = [];
  if (actor === '고객' && !policy.customerCancelEnabled) return { availability: '불가', approvalNeeded: false, partialAllowed: false, notes: ['고객 직접 취소가 비활성화되어 있습니다.'] };
  if (actor === '관리자' && !policy.adminCancelEnabled) return { availability: '불가', approvalNeeded: false, partialAllowed: false, notes: ['관리자 취소가 비활성화되어 있습니다.'] };

  const rule = stageRules.find((r) => r.stage === order.stage);
  if (!rule) return { availability: '불가', approvalNeeded: false, partialAllowed: false, notes: ['정의되지 않은 주문 단계입니다.'] };

  const availability = actor === '고객' ? rule.customerCancel : rule.adminCancel;
  notes.push(`현재 단계 '${order.stage}' 기준 ${actor} 취소: ${availability}`);

  if (order.shipped && availability !== '불가') {
    notes.push(`출고 이후 주문입니다. 정책상 '${policy.postShipmentAction}'가 권장됩니다.`);
  }
  if (order.contract) {
    notes.push(`계약 ${order.contract} 주문입니다. 계약별 취소 조건이 있다면 우선 적용됩니다. (확장 기능)`);
  }
  if (!order.paid) {
    notes.push('미결제 주문으로, 취소 시 환불 처리가 발생하지 않습니다.');
  } else if (availability !== '불가') {
    notes.push('결제 완료 주문으로, 취소 승인 후 환불 정책에 따라 환불이 생성됩니다.');
  }

  return {
    availability,
    approvalNeeded: rule.approval !== '불필요',
    partialAllowed: policy.partialCancelEnabled && policy.itemLevelPartialEnabled && availability !== '불가',
    notes,
  };
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof CancelPolicy; label: string; format: (p: CancelPolicy) => string }[] = [
  { key: 'customerCancelEnabled', label: '고객 직접 취소', format: (p) => (p.customerCancelEnabled ? '허용' : '불가') },
  { key: 'adminCancelEnabled', label: '관리자 취소', format: (p) => (p.adminCancelEnabled ? '허용' : '불가') },
  { key: 'fullCancelEnabled', label: '전체 주문 취소', format: (p) => (p.fullCancelEnabled ? '허용' : '불가') },
  { key: 'itemLevelPartialEnabled', label: '상품 단위 부분취소', format: (p) => (p.itemLevelPartialEnabled ? '사용' : '사용 안 함') },
  { key: 'partialCancelEnabled', label: '부분 취소', format: (p) => (p.partialCancelEnabled ? '허용' : '불가') },
  { key: 'defaultTimingBase', label: '기본 취소 가능 시점', format: (p) => p.defaultTimingBase },
  { key: 'cancelAllowedStages', label: '단계별 취소 허용', format: (p) => p.cancelAllowedStages.join(', ') || '없음' },
  { key: 'postShipmentAction', label: '출고 후 취소 요청', format: (p) => p.postShipmentAction },
  { key: 'withdrawPolicy', label: '취소 요청 철회', format: (p) => p.withdrawPolicy },
  { key: 'autoCancelOrderWhenFullyCancelled', label: '전량 취소 시 주문 자동 전환', format: (p) => (p.autoCancelOrderWhenFullyCancelled ? '사용' : '사용 안 함') },
  { key: 'restockOnCancel', label: '취소 시 재고 복원', format: (p) => (p.restockOnCancel ? '사용' : '사용 안 함') },
  { key: 'notifyOnCancelEvents', label: '취소 이벤트 알림', format: (p) => (p.notifyOnCancelEvents ? '사용' : '사용 안 함') },
];

export function describePolicyChanges(before: CancelPolicy, after: CancelPolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export function describeStageChanges(before: StageCancelRule[], after: StageCancelRule[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  after.forEach((rule) => {
    const prev = before.find((r) => r.stage === rule.stage);
    if (!prev) return;
    if (prev.customerCancel !== rule.customerCancel) diffs.push({ field: `${rule.stage} · 고객 취소`, before: prev.customerCancel, after: rule.customerCancel });
    if (prev.adminCancel !== rule.adminCancel) diffs.push({ field: `${rule.stage} · 관리자 취소`, before: prev.adminCancel, after: rule.adminCancel });
    if (prev.approval !== rule.approval) diffs.push({ field: `${rule.stage} · 승인`, before: prev.approval, after: rule.approval });
  });
  return diffs;
}

export function describeReasonChanges(before: CancelReason[], after: CancelReason[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  after.forEach((r) => {
    const prev = before.find((b) => b.id === r.id);
    if (!prev) {
      diffs.push({ field: `${r.audience} 취소 사유 추가`, before: '-', after: r.label });
      return;
    }
    if (prev.active !== r.active) diffs.push({ field: `${r.label} (${r.audience}) 노출`, before: prev.active ? '노출' : '비노출', after: r.active ? '노출' : '비노출' });
    if (prev.label !== r.label) diffs.push({ field: `${r.audience} 취소 사유명`, before: prev.label, after: r.label });
  });
  before.forEach((r) => {
    if (!after.find((a) => a.id === r.id)) diffs.push({ field: `${r.audience} 취소 사유 삭제`, before: r.label, after: '-' });
  });
  return diffs;
}

export interface ValidationWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: CancelPolicy, stageRules: StageCancelRule[], reasons: CancelReason[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (policy.customerCancelEnabled && stageRules.every((r) => r.customerCancel === '불가')) {
    warnings.push({ id: 'no-customer-stage', message: '고객 직접 취소를 허용했지만 취소 가능한 주문 단계가 없습니다.' });
  }
  if (policy.customerCancelEnabled && reasons.filter((r) => r.audience === '고객' && r.active).length === 0) {
    warnings.push({ id: 'no-customer-reason', message: '고객 노출 가능한 취소 사유가 없습니다.' });
  }
  const postShipmentAllowed = stageRules.filter((r) => POST_SHIPMENT_STAGES.has(r.stage) && (r.customerCancel !== '불가' || r.adminCancel !== '불가'));
  postShipmentAllowed.forEach((r) => {
    warnings.push({ id: `post-shipment-${r.stage}`, message: `'${r.stage}' 단계 이후에 일반 주문 취소가 허용되어 있습니다. 반품/회수 절차 전환을 권장합니다.` });
  });
  if (policy.partialCancelEnabled && !policy.itemLevelPartialEnabled) {
    warnings.push({ id: 'partial-no-item-level', message: '부분취소를 허용했지만 상품 단위 취소가 비활성화되어 있습니다.' });
  }

  return warnings;
}
